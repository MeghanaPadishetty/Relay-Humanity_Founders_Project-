import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  googleId:{type:String,index:true,unique:true,sparse:true}, email:{type:String,index:true}, name:String,
  tokens:{access_token:String,refresh_token:String,scope:String,token_type:String,expiry_date:Number}
},{timestamps:true});
const emailSchema = new mongoose.Schema({
  userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',index:true}, gmailId:{type:String,index:true}, threadId:String,
  from:String, fromName:String, to:String, subject:String, snippet:String, body:String, receivedAt:Date,
  unread:Boolean, starred:Boolean, category:{type:String,enum:['assistant','client','none'],default:'none'},
  priority:{type:String,enum:['high','normal','low'],default:'normal'}, confidence:Number, summary:String, recommendedAction:String, importantDates:[mongoose.Schema.Types.Mixed], pendingFollowUp:String,
  labels:[String]
},{timestamps:true});
emailSchema.index({userId:1,gmailId:1},{unique:true,sparse:true});
export const User=mongoose.model('User',userSchema);
export const Email=mongoose.model('Email',emailSchema);
