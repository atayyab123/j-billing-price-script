const model = require("../models/userRoleMap.model");

class service {
  async deleteUserRoleMapByUserId(userId, trx) {
    console.log('deleteUserRoleMapByUserId started');
    const data = await model.query(trx).delete().whereIn('userId', userId);
    console.log('deleteUserRoleMapByUserId completed successfully');
    return data;
  }
}
module.exports = new service();