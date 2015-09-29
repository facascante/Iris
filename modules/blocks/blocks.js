C.registerModule("blocks");

CM.blocks.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {

  CM.frontend.globals.parseBlock("block", data.html, function (block, next) {

    var blockName = block.split("|")[1];
    var blockType = block.split("|")[0];

    if (!blockName || !blockType) {

      next("<!--- Could not load block " + block + " --->");
      return false;

    };

    C.hook("hook_block_loadConfig", thisHook.authPass, {
      id: blockName,
      type: blockType
    }, null).then(function (config) {

      C.hook("hook_block_render", thisHook.authPass, {
        id: blockName,
        type: blockType,
        config: config
      }, null).then(function (blockHTML) {

        next(blockHTML);

      }, function (fail) {

        next("<!--- Could not load block " + block + " --->");

      });

    }, function (fail) {

      console.log(fail);

      next("<!--- Could not load block " + block + " --->");

    });

  }).then(function (html) {

    data.html = html;

    thisHook.finish(true, data);

  }, function (fail) {

    thisHook.finish(false, fail);

  });

});


CM.blocks.registerHook("hook_block_registerType", 0, function (thisHook, data) {

  if (!thisHook.const.name) {

    thisHook.finish(false, "must have a name");

  } else if (!thisHook.const.schema) {

    thisHook.finish(false, "must have a schema");

  } else {

    thisHook.finish(true, data);

  }

});

CM.blocks.registerHook("hook_block_loadConfig", 0, function (thisHook, data) {

  if (!thisHook.const.id) {

    thisHook.finish(false, "must have an id");

  } else if (!thisHook.const.type) {

    thisHook.finish(false, "must have a type");

  } else {

    C.readConfig('blocks/' + thisHook.const.type, thisHook.const.id).then(function (output) {

      thisHook.finish(true, output);

    }, function (fail) {

      thisHook.finish(true, "Could not load block");

    });

  }

});

CM.blocks.registerHook("hook_block_saveConfig", 0, function (thisHook, data) {

  if (!thisHook.const.id) {

    thisHook.finish(false, "must have an id");

  } else if (!thisHook.const.type) {

    thisHook.finish(false, "must have a type");

  } else {

    var config = thisHook.const;

    C.saveConfig(config, 'blocks/' + thisHook.const.type, config.id, function (output) {

      thisHook.finish(true, output);

    });

  }

});

CM.blocks.registerHook("hook_block_load", 0, function (thisHook, data) {

  if (!thisHook.const.id) {

    thisHook.finish(false, "must have an id");

  } else if (!thisHook.const.type) {

    thisHook.finish(false, "must have a type");

  } else {

    C.hook("hook_block_loadConfig", thisHook.authPass, thisHook.const, data).then(function (config) {

      var block = {

        id: thisHook.const.id,
        type: thisHook.const.type,
        config: config

      }

      C.hook("hook_block_render", thisHook.authPass, block, null).then(function (html) {

        thisHook.finish(true, html);

      }, function (fail) {

        thisHook.finish(false, fail);

      });

    }, function (fail) {

      thisHook.finish(false, fail);

    });

  }

});

CM.blocks.registerHook("hook_block_render", 0, function (thisHook, data) {

  if (!thisHook.const.id) {

    thisHook.finish(false, "must have an id");

  } else if (!thisHook.const.type) {

    thisHook.finish(false, "must have a type");

  } else if (!thisHook.const.config) {

    thisHook.finish(false, "must have a configuration");

  } else {

    thisHook.finish(true, data);

  }

});
