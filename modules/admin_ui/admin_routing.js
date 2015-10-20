CM.admin_ui.globals.registerPath = function (path, templateName) {

  C.app.get(path, function (req, res) {

    // If not admin, present login page
    if (req.authPass.roles.indexOf('admin') === -1) {

      if (req.url.indexOf('/admin2/login') !== 0) {

        res.redirect('/admin2/login');
        return false;

      }

    }

    CM.frontend.globals.findTemplate([templateName], "html").then(function (html) {

      CM.frontend.globals.parseTemplate(html, req.authPass).then(function (page) {

        res.send(page.html);

      });

    }, function () {

      var error = function (req, res) {

        res.send("Error loading template");

      };

    });

  });

}

CM.admin_ui.globals.registerPath("/admin2/login", "admin_login");
CM.admin_ui.globals.registerPath("/admin2/permissions", "admin_permissions");
CM.admin_ui.globals.registerPath("/admin2/entities", "admin_entitiy_types");