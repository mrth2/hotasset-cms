'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
  // override create controller to auto append author id
  async create(ctx) {
    let entity;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      data.author = ctx.state.user.id;
      entity = await strapi.services.asset.create(data, { files });
    } else {
      ctx.request.body.author = ctx.state.user.id;
      entity = await strapi.services.asset.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.models.asset });
  },
  // override update controller to auto check for owner
  async update(ctx) {
    const { id } = ctx.params;

    let entity;

    const [asset] = await strapi.services.asset.find({
      id: ctx.params.id,
      // 'author.id': ctx.state.user.id,
    });

    // asset not found
    if (!asset) {
      return ctx.unauthorized(`You can't update this asset`);
    }
    // asset is not owned => only allow to update upvoter ( like / unlike )
    else if (asset && asset.author.id !== ctx.state.user.id) {
      // check for upvoters from body
      const upvoters = ctx.request.body.upvoters
      if (upvoters && Array.isArray(upvoters)) {
        // check if user is upvoter
        let currentUpvoterWithoutUser = []
        if (asset.upvoters.length) {
          currentUpvoterWithoutUser = asset.upvoters
            // filter out current user
            .filter(upvoter => upvoter.id !== ctx.state.user.id)
            // return _id only
            .map(upvoter => upvoter._id);
        }
        if (upvoters.length === 1 && upvoters[0] === ctx.state.user.id) {
          entity = await strapi.services.asset.update({ id }, {
            upvoters: [
              ctx.state.user._id,
              ...currentUpvoterWithoutUser,
            ]
          });
        }
        // check if user is not upvoter
        else if (upvoters.length === 0) {
          entity = await strapi.services.asset.update({ id }, {
            upvoters: currentUpvoterWithoutUser
          })
        }
        // return updated like / unlike asset
        if (entity) {
          return sanitizeEntity(entity, { model: strapi.models.asset });
        }
      }
      return ctx.unauthorized(`You can't update this asset`);
    }

    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.asset.update({ id }, data, {
        files,
      });
    } else {
      entity = await strapi.services.asset.update({ id }, ctx.request.body);
    }

    return sanitizeEntity(entity, { model: strapi.models.asset });
  },
  // override delete controller to auto check for owner
  async delete(ctx) {
    const { id } = ctx.params;

    let entity;

    const [asset] = await strapi.services.asset.find({
      id: ctx.params.id,
      'author.id': ctx.state.user.id,
    });

    if (!asset) {
      return ctx.unauthorized(`You can't delete this asset`);
    }

    return await strapi.services.asset.delete({ id });
  },
};
