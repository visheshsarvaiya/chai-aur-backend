import mongoose, { Schema } from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const videoSchema = new Schema(
  {
    videoFile: {
      type: String, // Cloudinary URL
      required: true
    },

    thumbnail: {
      type: String, // Cloudinary URL
      required: true
    },

    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    views: {
      type: Number,
      default: 0
    },

    isPublish: {
      type: Boolean, // Changed from Number to Boolean
      default: true
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
)

// Apply pagination plugin
videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)
