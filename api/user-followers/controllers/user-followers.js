'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const { sanitizeEntity } = require('strapi-utils');

module.exports = {
  async create(ctx) {
    // the target user to follow by current logged in user
    const { user: userId } = ctx.request.body;
    const user = await strapi.query('user', 'users-permissions').findOne({ id: userId });
    if (!user) {
      return ctx.badRequest(null, { messages: 'No user to follow!' });
    }
    // check if current logged in user is following the target user
    let entity = await strapi.query('user-followers').find({
      user: userId,
      follower: ctx.state.user.id,
    })
    if (entity.length > 0) {
      entity = entity[0];
    }
    else {
      // create follower relation
      entity = await strapi.query('user-followers').create({
        user: userId,
        follower: ctx.state.user.id,
      })
    }
    return sanitizeEntity(entity, { model: strapi.models['user-followers'] });
  },
  async delete(ctx) {
    // the target user to unfollow by current logged in user
    const { id: userId } = ctx.params;
    const user = await strapi.query('user', 'users-permissions').findOne({ id: userId });
    if (!user) {
      return ctx.badRequest(null, { messages: 'No user to unfollow!' });
    }
    // remove the follower relation
    const entity = await strapi.query('user-followers').delete({ 
      user : userId,
      follower: ctx.state.user.id,
    });
    return sanitizeEntity(entity, { model: strapi.models['user-followers'] });
  }
};
