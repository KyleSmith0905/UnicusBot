const userinfo = mongo.Schema({
  userID: String,
  serverID: String,
  money: Number,
  state: String
});

module.exports = mongo.model('userinfo', userinfo)