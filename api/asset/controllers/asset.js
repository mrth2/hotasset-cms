'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
const _ = require('lodash');

async function autoSyncTags(tags) {
  if (!tags || tags.length === 0) return []
  // check if tags need to be created
  // console.log('tags', tags);
  // find tags that has name => add these tags to database
  let newTags = []
  let oldTags = []
  tags.forEach(tag => {
    if (typeof tag.name !== 'undefined') newTags.push(tag)
    else oldTags.push(tag)
  })
  // console.log('new tags', newTags);
  // console.log('old tags', oldTags)
  // check tags already exists
  const existingTags = await strapi.query('tag').find({ name_in: newTags.map(tag => tag.name) });
  // console.log('existing tags', existingTags);
  // all tags is not existed => create missing tags
  if (existingTags.length <= newTags.length) {
    newTags = newTags.filter(tag => existingTags.find(existingTag => existingTag.name === tag.name) === undefined);
    // console.log('real new tags', newTags);

    const createdTags = []
    // add new tags to database
    for (const tag of newTags) {
      const newTag = await strapi.services.tag.create({
        name: tag.name
      })
      // console.log('newTag', newTag)
      if (newTag.id) {
        createdTags.push(newTag.id);
      }
    }
    // console.log('createdTags', createdTags);
    // update old tags with new tags created
    return _.uniq([...oldTags, ...existingTags.map(t => t.id), ...createdTags])
  }
  // return list of tag ids
  return _.uniq([...oldTags])
}

module.exports = {
  // override create controller to auto append author id
  async create(ctx) {
    let entity;

    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);

      // sync missing tags
      const _tags = await autoSyncTags(data.tags);
      if (_tags && _tags.length > 0) {
        data.tags = _tags;
      }
      // create asset with files
      data.author = ctx.state.user.id;
      entity = await strapi.services.asset.create(data, { files });
    } else {
      // sync missing tags
      const _tags = await autoSyncTags(ctx.request.body.tags);
      if (_tags && _tags.length > 0) {
        ctx.request.body.tags = _tags;
      }
      // create asset
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
      // sync missing tags
      const _tags = await autoSyncTags(data.tags);
      if (_tags && _tags.length > 0) {
        data.tags = _tags;
      }
      // update asset with files
      entity = await strapi.services.asset.update({ id }, data, {
        files,
      });
    } else {
      // sync missing tags
      const _tags = await autoSyncTags(ctx.request.body.tags);
      if (_tags && _tags.length > 0) {
        ctx.request.body.tags = _tags;
      }
      // update asset
      entity = await strapi.services.asset.update({ id }, ctx.request.body);
    }

    return sanitizeEntity(entity, { model: strapi.models.asset });
  },
  // override delete controller to auto check for owner
  async delete(ctx) {
    const { id } = ctx.params;

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
