//Create and edit forms

var path = require('path');

C.app.get("/admin/create/:type", function (req, res) {

  if (CM.admin.globals.checkAdmin(req)) {

    res.sendFile(path.join(__dirname, 'create.html'));

  } else {

    res.redirect("/admin");

  }

});

C.app.post("/schema/create", function (req, res) {

  var model = req.body.entityname;

  delete req.body.entityname;
  
  schema = {};

  var converters = {};

  converters["text"] = function (element) {

    var field = {};
    field.type = String;

    if (element.required === "true") {

      field.required = true;

    };

    if (element.label) {

      field.title = element.label;

    };

    if (element.description) {

      field.description = element.description;

    };

    return field;

  };

  converters["longtext"] = function (element) {

    var field = {};
    field.type = String;
    field.long = true;

    if (element.required === "true") {

      field.required = true;

    };

    if (element.label) {

      field.title = element.label;

    };

    if (element.description) {

      field.description = element.description;

    };

    return field;

  };

  converters["select"] = function (element) {
    
    var field = {};
    field.type = String;
    field.long = true;

    if (element.required === "true") {

      field.required = true;

    };

    if (element.label) {

      field.title = element.label;

    };

    if (element.description) {

      field.description = element.description;

    };

    field.enum = element.options;

    return field;

  };

  converters['object'] = function (element) {

    var field = {};

    if (element.required === "true") {

      field.required = true;

    };

    if (element.label) {

      field.title = element.label;

    };

    if (element.description) {

      field.description = element.description;

    };

    if (element.subfields) {

      field.type = [{}];

      element.subfields.forEach(function (subfield, index) {

        var type = Object.keys(subfield)[1];

        if (converters[type]) {

          field.type[0][subfield[type]['system-name']] = converters[type](subfield[type]);

        }

      });

    }

    return field;

  };

  //Loop over all the fields in the fields array and convert based on type

  if (req.body.fields) {

    req.body.fields.forEach(function (element, index) {
      
      var type = Object.keys(element)[1];

      if (converters[type]) {

        schema[element[type]['system-name']] = converters[type](element[type]);

      }

    });

  };
  
  C.registerDbModel(model);
  C.registerDbSchema(model, schema);
  C.dbPopulate();

});

C.app.get("/admin/edit/:type/:id", function (req, res) {

  if (CM.admin.globals.checkAdmin(req)) {

    res.sendFile(path.join(__dirname, 'edit.html'));

  } else {

    res.redirect("/admin");

  }

});

C.app.get("/admin/edit/:type/:_id/form", function (req, res) {

  if (CM.admin.globals.checkAdmin(req)) {

    if (!C.dbCollections[req.params.type]) {

      res.respond(400, "No such type");
      return false;

    }

    C.dbCollections[req.params.type].findOne({
      "_id": req.params._id
    }, function (err, doc) {

      if (err) {

        res.respond(500, "Database error");

      }

      if (doc) {

        editForm(doc);

      } else {

        res.respond(400, "Entity not found");

      }

    });

    var editForm = function (doc) {

      var tree = C.dbCollections[req.params.type].schema.tree;

      var newTree = {
        schema: {}
      };

      Object.keys(tree).forEach(function (item) {

        if (item === "id" || item === "_id" || item === "__v" || item === "entityType") {

          return false;

        }

        if (checkField(item, tree[item])) {

          newTree.schema[item] = checkField(item, tree[item]);

        }

      })

      newTree.form = [
    "*",
        {
          "type": "submit",
          "title": "Save"
    }
  ];

      newTree.value = doc;

      res.send(newTree);

    }

  } else {

    res.redirect("/admin");

  }

});


C.app.get("/admin/create/:type/form/", function (req, res) {

  if (CM.admin.globals.checkAdmin(req)) {

    if (!C.dbCollections[req.params.type]) {

      res.respond(400, "No such type");
      return false;

    }

    var tree = C.dbCollections[req.params.type].schema.tree;

    var newTree = {
      schema: {}
    };

    Object.keys(tree).forEach(function (item) {

      if (item === "id" || item === "_id" || item === "__v" || item === "entityType") {

        return false;

      }

      if (checkField(item, tree[item])) {

        newTree.schema[item] = checkField(item, tree[item]);

      }

    })

    newTree.form = [
    "*",
      {
        "type": "submit",
        "title": "Save"
    }
  ];

    res.send(newTree);

  } else {

    res.redirect("/admin");

  }

});

var checkField = function (key, item) {

  if (item === String) {

    return {

      "title": key,
      "type": "string",
      "required": item.required

    };

  }

  var type = item.type;

  if (type === Date) {

    return {

      "title": item.title,
      "description": item.description,
      "type": "date",
      "required": item.required

    };


  }

  if (type === String) {

    if (item.enum) {

      return {

        "title": key,
        "type": "string",
        "required": item.required,
        "enum": item.enum

      };

    } else if (item.long) {

      return {

        "title": key,
        "type": "textarea",
        "required": item.required,

      };

    } else {

      return {

        "title": key,
        "type": "string",
        "required": item.required,

      };

    }

  }

  if (item.type === Boolean) {

    return {

      "title": key,
      "type": "boolean",
      "required": item.required,

    };

  }

  //Check if array

  if (Array.isArray(item.type)) {

    var array = {

      type: "array",
      title: key,
      items: checkField(key, item.type[0]),

    }

    return array;

  } else if (typeof item === "object") {

    var toInsert = {

      type: "object",
      title: key,
      required: item.required,
      properties: {}

    }

    Object.keys(item).forEach(function (propertyName) {

      toInsert.properties[propertyName] = checkField(propertyName, item[propertyName])

    });

    return toInsert;

  }

};
