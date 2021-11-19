const Boom = require('boom')
const _ = require('lodash');

module.exports = {
  resolver: {
    Mutation: {
      updateUser: {
        description: 'Update an existing user',
        policies: ['plugins::users-permissions.isAuthenticated'],
        resolver: async (obj, options, { context }) => {

          // If the user is an administrator we allow them to perform this action unrestricted
          if (context.state.user.role.name === "admin") {
            context.params = _.toPlainObject(options.input.where)
            context.request.body = _.toPlainObject(options.input.data)

            await strapi.plugins['users-permissions'].controllers.user.update(context)

            return {
              user: context.body.toJSON ? context.body.toJSON() : context.body,
            }
          }

          // The data to mutate
          const data = context.request.body;
          // The Current User ID
          const currentUserId = context.state.user.id
          // The ID which the user like to mutate
          const userToUpdate = context.params.id

          // This limitate the user to only edit his own profile
          if (currentUserId != userToUpdate) throw Boom.unauthorized('Unable to edit this user ID')

          // Extract the fields to do some checks on it
          const { firstname, lastname } = data;

          // Check if firstname ist empty and if give badRequest
          if (firstname && firstname.trim() === "" || firstname === "") throw Boom.badRequest("Firstname is required")

          // Check if lastname ist empty and if give badRequest
          if (lastname && lastname.trim() === "" || lastname === "") throw Boom.badRequest("Lastname is required")

          // Get the value of the where variable. In this case the user ID
          context.params = _.toPlainObject(options.input.where)

          // The Data to edit
          context.request.body = _.toPlainObject(options.input.data)

          // Edit the user data
          await strapi.plugins['users-permissions'].controllers.user.update(context)

          // Return the data
          return {
            user: context.body.toJSON ? context.body.toJSON() : context.body,
          }
        }
      },
    },
  },
};