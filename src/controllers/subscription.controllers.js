import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    const channel =  await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(404, "Subscriber not found")
    }

    const subscription = await Subscription.findOne(
        {subscriber: user._id, channel: channel._id}
    )

    if(subscription){
        await subscription.remove()

        return (res.status(200).json(new ApiResponse(200, null, "Unsubscribed successfully")))

    } else {
        await Subscription.create(
            {
                subscriber: user._id,
                channel: channel._id
            }
        )

        return (res.status(200).json(new ApiResponse(200, null, "Subscribed successfully")))
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    const channel  = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    const subscribers = await Subscription.find({channel: channel?._id}).populate("subscriber")
    if (!subscribers || subscribers.length === 0) {
        throw new ApiError(404, "No subscribers found")
    }
    const subscribersList = subscribers.map(subscriber => subscriber.subscriber)
    const subscribersCount = subscribersList.length

    return (   
         res
         .status(200)
         .json(new ApiResponse(200, {subscribers: subscribersList, subscribersCount}, "Subscribers found successfully"))
        )     
   

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber id")
    }

    const user = await User.findById(subscriberId)
    if (!user) {
        throw new ApiError(404, "Subscriber not found")
    }

    const subscriptions = await Subscription.find({subscriber: user?._id}).populate("channel")
    if (!subscriptions || subscriptions.length === 0) {
        throw new ApiError(404, "No subscriptions found")
    }
    const subscribedChannels = subscriptions.map(subscription => subscription.channel)
    const subscribedChannelsCount = subscribedChannels.length

    return (
        res
        .status(200)
        .json(new ApiResponse(200, {subscriptions: subscribedChannels, subscribedChannelsCount}, "Subscribed channels found successfully"))
    )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}