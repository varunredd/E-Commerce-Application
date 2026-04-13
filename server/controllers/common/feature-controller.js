const Feature = require("../../models/Feature");

const addFeatureImage = async (req, res) => {
  try {
    const { image } = req.body;

    const featureImages = new Feature({
      image,
    });

    await featureImages.save();

    res.status(201).json({
      success: true,
      data: featureImages,
    });
  } catch (e) {
    console.error("Add feature image error:", e.message);
    res.status(500).json({
      success: false,
      message: "Failed to add feature image",
    });
  }
};

const getFeatureImages = async (req, res) => {
  try {
    const images = await Feature.find({});

    res.status(200).json({
      success: true,
      data: images,
    });
  } catch (e) {
    console.error("Get feature images error:", e.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feature images",
    });
  }
};

const deleteFeatureImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Feature.findByIdAndDelete(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (e) {
    console.error("Delete feature image error:", e.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete feature image",
    });
  }
};

module.exports = { addFeatureImage, getFeatureImages, deleteFeatureImage };