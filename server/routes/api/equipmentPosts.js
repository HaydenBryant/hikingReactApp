const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator/check");
const auth = require("../../middleware/auth");

const EquipmentPost = require("../../models/EquipmentPost");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

//@route Post api/equipmentPosts
//@desc Create an equipment post
//@access Private
router.post(
  "/",
  [
    auth,
    [
      check("company", "Company is required")
        .not()
        .isEmpty()
    ],
    [
      check("equipmentType", "Equipment type is required")
        .not()
        .isEmpty()
    ],
    [
      check("equipmentName", "Equipment name is required")
        .not()
        .isEmpty()
    ],
    [
      check("review", "Review is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");

      const newEquipmentPost = new EquipmentPost({
        company: req.body.company,
        equipmentType: req.body.equipmentType,
        equipmentName: req.body.equipmentName,
        review: req.body.review,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      const equipmentPost = await newEquipmentPost.save();

      res.json(equipmentPost);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

//@route GET api/equipmentPosts
//@desc Get all equipment posts
//@access Private
router.get("/", auth, async (req, res) => {
  try {
    const equipmentPosts = await EquipmentPost.find().sort({ date: -1 });
    res.json(equipmentPosts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route GET api/equipmentPosts/:id
//@desc Get equipment post by id
//@access Private
router.get("/:id", auth, async (req, res) => {
  try {
    const equipmentPost = await EquipmentPost.findById(req.params.id);

    if (!equipmentPost) {
      return res.status(404).json({ msg: "Post not found" });
    }

    res.json(equipmentPost);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route    DELETE api/equipmentPosts/:id
// @desc     Delete an equipment post
// @access   Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const equipmentPost = await EquipmentPost.findById(req.params.id);

    if (!equipmentPost) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check user
    if (equipmentPost.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    await equipmentPost.remove();

    res.json({ msg: "Post removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route    PUT api/equipmentPosts/like/:id
// @desc     Like an equipment post
// @access   Private
router.put("/like/:id", auth, async (req, res) => {
  try {
    const equipmentPost = await EquipmentPost.findById(req.params.id);

    // Check if the post has already been liked
    if (
      equipmentPost.likes.filter(like => like.user.toString() === req.user.id).length > 0
    ) {
      return res.status(400).json({ msg: "Post already liked" });
    }

    equipmentPost.likes.unshift({ user: req.user.id });

    await equipmentPost.save();

    res.json(equipmentPost.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route    PUT api/equipmentPosts/unlike/:id
// @desc     Unlike an equipment post
// @access   Private
router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const equipmentPost = await EquipmentPost.findById(req.params.id);

    // Check if the post has already been liked
    if (
      equipmentPost.likes.filter(like => like.user.toString() === req.user.id).length ===
      0
    ) {
      return res.status(400).json({ msg: "Post has not yet been liked" });
    }

    // Get remove index
    const removeIndex = equipmentPost.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);

    equipmentPost.likes.splice(removeIndex, 1);

    await equipmentPost.save();

    res.json(equipmentPost.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route Post api/equipmentPosts/comment/:id
//@desc Comment on an equipment post
//@access Private
router.post(
  "/comment/:id",
  [
    auth,
    [
      check("text", "Text is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");

      const equipmentPost = await EquipmentPost.findById(req.params.id);

      const newComment = ({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      equipmentPost.comments.unshift(newComment);

      await equipmentPost.save();

      res.json(equipmentPost.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route    DELETE api/equipmentPosts/comment/:id/:comment_id
// @desc     Delete comment
// @access   Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const equipmentPost = await EquipmentPost.findById(req.params.id);

    // Pull out comment
    const comment = equipmentPost.comments.find(
      comment => comment.id === req.params.comment_id
    );

    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: 'Comment does not exist' });
    }

    // Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Get remove index
    const removeIndex = equipmentPost.comments
      .map(comment => comment.id)
      .indexOf(req.params.comment_id);

    equipmentPost.comments.splice(removeIndex, 1);

    await equipmentPost.save();

    res.json(equipmentPost.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;