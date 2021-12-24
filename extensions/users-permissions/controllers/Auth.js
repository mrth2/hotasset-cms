const _ = require('lodash');
const { sanitizeEntity } = require('strapi-utils');

async function getSettings() {
  return await strapi
    .store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
      key: 'advanced',
    })
    .get();
}

module.exports = {
  async emailConfirmation(ctx, next, returnUser) {
    const { confirmation: confirmationToken } = ctx.query;

    const { user: userService, jwt: jwtService } = strapi.plugins['users-permissions'].services;

    if (_.isEmpty(confirmationToken)) {
      return ctx.badRequest('token.invalid');
    }

    const user = await userService.fetch({ confirmationToken }, []);

    if (!user) {
      const settings = await getSettings();
      // modify empty confirmation token: redirect to frontend with specific message instead of return token invalid
      let redirectUrl = settings.email_confirmation_redirection || '/'
      redirectUrl += '#message=' + encodeURIComponent('Your account email is already confirmed.');
      ctx.redirect(redirectUrl);
      return;
      // return ctx.badRequest('token.invalid');
    }

    await userService.edit({ id: user.id }, { confirmed: true, confirmationToken: null });

    if (returnUser) {
      ctx.send({
        jwt: jwtService.issue({ id: user.id }),
        user: sanitizeEntity(user, {
          model: strapi.query('user', 'users-permissions').model,
        }),
      });
    } else {
      const settings = await getSettings();

      ctx.redirect(settings.email_confirmation_redirection || '/');
    }
  },
}