import Report from '../models/report.model.js';
import Post from '../models/post.model.js';

// Create a new report
export const createReport = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason, description } = req.body;
    const userId = req.user._id;

    // Validate post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user already reported this post
    const existingReport = await Report.findOne({
      postId,
      reportedBy: userId
    });

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this post' });
    }

    // Create report
    const report = new Report({
      postId,
      reportedBy: userId,
      reason,
      description
    });

    await report.save();

    // Increment post's report count
    await Post.findByIdAndUpdate(postId, {
      $inc: { reportsCount: 1 }
    });

    // Auto-remove post if it reaches threshold (5 reports = auto-remove)
    const totalReports = await Report.countDocuments({ postId, status: 'pending' });
    if (totalReports >= 5 && post.status === 'published') {
      await Post.findByIdAndUpdate(postId, {
        status: 'removed'
      });
    }

    res.status(201).json({
      message: 'Report submitted successfully',
      report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Error submitting report', error: error.message });
  }
};

// Get user's reports
export const getMyReports = async (req, res) => {
  try {
    const userId = req.user._id;

    const reports = await Report.find({ reportedBy: userId })
      .populate('postId', 'content images videos author')
      .populate({
        path: 'postId',
        populate: {
          path: 'author',
          select: 'name username avatar'
        }
      })
      .sort({ createdAt: -1 });

    res.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
};
