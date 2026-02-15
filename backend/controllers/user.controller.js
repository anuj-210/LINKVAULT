import { Share } from '../models/index.js';

export const getMyShares = async (req, res) => {
  try {
    const shares = await Share.find({ ownerId: req.user._id }).sort({ createdAt: -1 }).lean();
    const mapped = shares.map((share) => ({
      shareId: share.shareId,
      type: share.type,
      filename: share.filename || null,
      ownerOnly: !!share.ownerOnly,
      oneTime: !!share.oneTime,
      views: share.views,
      maxViews: share.maxViews || null,
      expiresAt: share.expiresAt,
      createdAt: share.createdAt
    }));

    return res.json({ shares: mapped });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load shares' });
  }
};
