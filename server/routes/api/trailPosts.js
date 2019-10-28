const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator/check");
const auth = require("../../middleware/auth");

const TrailPost = require("../../models/TrailPost");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

//@route Post api/trailPosts
//@desc Create a Trail Post
//@access Private
router.post(
  "/",
  [
    auth,
    [
      check("trailName", "Trail name is required")
        .not()
        .isEmpty()
    ],
    [
      check("location", "Location is required")
        .not()
        .isEmpty()
    ],
    [
      check("description", "Description is required")
        .not()
        .isEmpty()
    ],
    [
      check("trailLength", "Trail length must be a number")
      .isNumeric()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");

      const newTrailPost = new TrailPost({
        trailName: req.body.trailName,
        location: req.body.location,
        description: req.body.description,
        trailLength: req.body.trailLength,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      const trailPost = await newTrailPost.save();

      res.json(trailPost);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

//@route GET api/trailPosts
//@desc Get all Trail posts
//@access Private
router.get("/", auth, async (req, res) => {
  try {
    const trailPosts = await TrailPost.find().sort({ date: -1 });
    res.json(trailPosts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route GET api/trailPosts/:id
//@desc Get trail post by id
//@access Private
router.get("/:id", auth, async (req, res) => {
  try {
    const trailPost = await TrailPost.findById(req.params.id);

    if (!trailPost) {
      return res.status(404).json({ msg: "Post not found" });
    }

    res.json(trailPost);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route    DELETE api/trailPosts/:id
// @desc     Delete a trail post
// @access   Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const trailPost = await TrailPost.findById(req.params.id);

    if (!trailPost) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check user
    if (trailPost.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    await trailPost.remove();

    res.json({ msg: "Post removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route    PUT api/trailPosts/like/:id
// @desc     Like a trail post
// @access   Private
router.put("/like/:id", auth, async (req, res) => {
  try {
    const trailPost = await TrailPost.findById(req.params.id);

    // Check if the post has already been liked
    if (
      trailPost.likes.filter(like => like.user.toString() === req.user.id).length > 0
    ) {
      return res.status(400).json({ msg: "Post already liked" });
    }

    trailPost.likes.unshift({ user: req.user.id });

    await trailPost.save();

    res.json(trailPost.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route    PUT api/trailPosts/unlike/:id
// @desc     Unlike a trail post
// @access   Private
router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const trailPost = await TrailPost.findById(req.params.id);

    // Check if the post has already been liked
    if (
      trailPost.likes.filter(like => like.user.toString() === req.user.id).length ===
      0
    ) {
      return res.status(400).json({ msg: "Post has not yet been liked" });
    }

    // Get remove index
    const removeIndex = trailPost.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);

    trailPost.likes.splice(removeIndex, 1);

    await trailPost.save();

    res.json(trailPost.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route Post api/trailPosts/comment/:id
//@desc Comment on a trail post
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

      const trailPost = await TrailPost.findById(req.params.id);

      const newComment = ({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      trailPost.comments.unshift(newComment);

      await trailPost.save();

      res.json(trailPost.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route    DELETE api/trailPosts/comment/:id/:comment_id
// @desc     Delete comment
// @access   Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const trailPost = await TrailPost.findById(req.params.id);

    // Pull out comment
    const comment = trailPost.comments.find(
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
    const removeIndex = trailPost.comments
      .map(comment => comment.id)
      .indexOf(req.params.comment_id);

    trailPost.comments.splice(removeIndex, 1);

    await trailPost.save();

    res.json(trailPost.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;