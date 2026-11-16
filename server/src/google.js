import {google} from 'googleapis';
import {User,Email} from './models.js';
import {protect,reveal} from './security.js';
export function oauthClient(){return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID,process.env.GOOGLE_CLIENT_SECRET,process.env.GOOGLE_REDIRECT_URI);}
export function authUrl(state){return oauthClient().generateAuthUrl({access_type:'offline',prompt:'consent',include_granted_scopes:true,scope:['openid','email','profile','https://www.googleapis.com/auth/gmail.readonly','https://www.googleapis.com/auth/gmail.send'],state});}
export async function saveGoogleUser(code){
  const client=oauthClient(); const {tokens}=await client.getToken(code); client.setCredentials(tokens);
  const oauth2=google.oauth2({version:'v2',auth:client}); const {data:profile}=await oauth2.userinfo.get();
  const safeTokens={...tokens,access_token:protect(tokens.access_token),refresh_token:protect(tokens.refresh_token)};
  const user=await User.findOneAndUpdate({googleId:profile.id},{googleId:profile.id,email:profile.email,name:profile.name,tokens:safeTokens},{new:true,upsert:true,setDefaultsOnInsert:true});
  return user;
}
export async function gmailClient(user){
  const c=oauthClient(); c.setCredentials({...user.tokens,access_token:reveal(user.tokens.access_token),refresh_token:reveal(user.tokens.refresh_token)});
  c.on('tokens',async t=>{const patch={...user.tokens,...t}; if(t.access_token)patch.access_token=protect(t.access_token);if(t.refresh_token)patch.refresh_token=protect(t.refresh_token); await User.updateOne({_id:user._id},{$set:{tokens:patch}});});
  return google.gmail({version:'v1',auth:c});
}
function decode(data=''){return Buffer.from(data.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8');}
function getBody(payload){
  if(!payload)return '';
  if(payload.body?.data && payload.mimeType==='text/plain')return decode(payload.body.data);
  for(const p of payload.parts||[]){const found=getBody(p);if(found)return found;}
  if(payload.body?.data)return decode(payload.body.data);
  return '';
}
function header(headers,name){return headers?.find(h=>h.name?.toLowerCase()===name.toLowerCase())?.value||'';}
export async function syncInbox(user,maxResults=40){
  const gmail=await gmailClient(user); const list=await gmail.users.messages.list({userId:'me',maxResults, q:'in:anywhere -in:trash'});
  const ids=list.data.messages||[]; const saved=[];
  for(const item of ids){
    const {data:m}=await gmail.users.messages.get({userId:'me',id:item.id,format:'full'}); const h=m.payload?.headers||[];
    const from=header(h,'From'); const match=from.match(/^(.*?)\s*<([^>]+)>$/);
    const labels=m.labelIds||[]; const rawBody=getBody(m.payload);
    const doc=await Email.findOneAndUpdate({userId:user._id,gmailId:m.id},{userId:user._id,gmailId:m.id,threadId:m.threadId,from:match?.[2]||from,fromName:(match?.[1]||from).replaceAll('"',''),to:header(h,'To'),subject:header(h,'Subject')||'(No subject)',snippet:m.snippet||'',body:rawBody.slice(0,18000),receivedAt:new Date(Number(m.internalDate)||Date.now()),unread:labels.includes('UNREAD'),starred:labels.includes('STARRED'),labels},{new:true,upsert:true,setDefaultsOnInsert:true});
    saved.push(doc);
  }
  return saved;
}
export async function sendGmail(user,{to,subject,body,threadId}){
  const gmail=await gmailClient(user); const lines=[`To: ${to}`,`Subject: ${subject}`,'MIME-Version: 1.0','Content-Type: text/plain; charset="UTF-8"','',body];
  const raw=Buffer.from(lines.join('\r\n')).toString('base64url');
  const result=await gmail.users.messages.send({userId:'me',requestBody:{raw,...(threadId?{threadId}:{})}});return result.data;
}
