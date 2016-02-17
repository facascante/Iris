// Add a member to a group

iris.route.post("/groups/addMember/:groupid/:member/:entityType/:entityField", function (req, res) {

    var fetch = {
        entities: ["group"],
        queries: [{
            field: "eid",
            "operator": "is",
            "value": parseInt(req.params.groupid)
        }]
    }

    iris.hook("hook_entity_fetch", req.authPass, null,
        fetch
    ).then(function (groupResult) {

            if (groupResult.length) {

                var exists = false;
                for (var i = 0; i < groupResult[0].field_users; i++) {
                    if (groupResult[0].field_users[i].field_uid == req.params.member) {
                        exists = true;
                    }
                }
                if (exists) {

                    res.status(400).send("Member already in group");

                } else {

                    // Check if user exists on system

                    var fetch = {
                        entities: [req.params.entityType],
                        queries: [{
                            field: req.params.entityField,
                            "operator": "is",
                            "value": parseInt(req.params.member)
                        }]
                    }

                    iris.hook("hook_entity_fetch", req.authPass, null, fetch).then(function (userResult) {

                        if (userResult.length) {

                            // If current group is has only 2 members, create new groups. Otherwise, add to current group.

                            var fieldSplit = req.params.entityField.split('.');
                            if (groupResult[0].fieldSplit[0].length == 2) {
                                var newGroup = groupResult[0];
                                var obj = {};
                                obj[fieldSplit[1]] = userResult[0][fieldSplit[1]];
                                newGroup[fieldSplit[0]].push(obj);

                                newGroup[name] += ', ' + userResult[0].field_username;

                                iris.hook("hook_entity_edit", req.authPass, newGroup, req.params.entityType).then(function (success) {

                                }, function (fail) {

                                    res.status(400).send(fail);

                                });
                            } else {
                                // Update entity

                                iris.hook("hook_entity_edit", req.authPass, groupResult[0], groupResult[0]).then(function (success) {

                                }, function (fail) {

                                    res.status(400).send(fail);

                                });
                            }

                        } else {

                            res.status(400).send("Not a valid member");

                        }

                    }, function (fail) {

                        res.status(400).send(fail);

                    })

                }


            } else {

                res.status(400).send("Not a valid group")

            }
        },
        function (fail) {

            res.status(400).send(fail);

        });


})

// Remove member from group

// Add a member to a group

iris.route.post("/groups/removeMember/:groupid/:member", function (req, res) {

    var fetch = {
        entities: ["group"],
        queries: [{
            field: "eid",
            "operator": "is",
            "value": req.params.groupid
        }]
    }

    iris.hook("hook_entity_fetch", req.authPass, null, fetch).then(function (groupResult) {

            if (groupResult.length) {

                if (groupResult[0].members.indexOf(parseInt(req.params.member)) === -1) {

                    res.status(400).send("Member not in group");

                } else {


                    // All OK, try to add member to group

                    var memberIndex = groupResult[0].members.indexOf(parseInt(req.params.member));

                    groupResult[0].members.splice(memberIndex, 1);

                    // Update entity

                    iris.hook("hook_entity_edit", req.authPass, groupResult[0], groupResult[0]).then(function (success) {

                        res.send(success);

                    }, function (fail) {

                        res.status(400).send(fail);

                    })

                }


            } else {

                res.status(400).send("Not a valid group")

            }
        },
        function (fail) {

            res.status(400).send(fail);

        });
});

iris.route.get("/read-group/:gid/:uid", {}, function (req, res) {

    var fetch = {
        entities: ["group"],
        queries: [{
            field: "eid",
            "operator": "is",
            "value": req.params.gid
        }]
    }

    iris.hook("hook_entity_fetch", req.authPass, null, fetch).then(function (group) {
        group = group[0];

        group.field_users.forEach(function (user, index) {

            if (user.field_uid == req.params.uid) {
                group.field_users[index].field_last_checked = Math.floor(Date.now() / 1000);

                iris.hook("hook_entity_edit", 'root', group, group).then(function (success) {

                }, function (fail) {
                    iris.log("error", fail);
                });
            }
        });

    });
    res.send('Registered');

});

iris.modules.groups.registerHook("hook_entity_presave", 0, function (thisHook, entity) {


    if (entity.entityType == 'message') {

        entity.field_created = Math.floor(Date.now() / 1000);
        var fetch = {
            entities: ["group"],
            queries: [{
                field: "eid",
                "operator": "is",
                "value": (typeof entity.groups == 'array') ? entity.groups[0] : entity.groups
            }]
        }

        iris.hook("hook_entity_fetch", thisHook.authPass, null, fetch).then(function (groupResult) {

            if (groupResult.length > 0) {
                groupResult[0].field_last_updated = Math.floor(Date.now() / 1000);

                iris.hook("hook_entity_edit", thisHook.authPass, groupResult[0], groupResult[0]).then(function (success) {

                }, function (fail) {
                    iris.log("error", fail);
                });
            }
        }, function (fail) {
            iris.log("error", fail);
        });

    }

    thisHook.finish(true, entity);

});

iris.modules.groups.registerHook("hook_entity_presave_group", 0, function (thisHook, entity) {

    entity.field_last_updated = Math.floor(Date.now() / 1000);

    thisHook.finish(true, entity);

});

iris.modules.groups.registerHook("hook_entity_view_group", 0, function (thisHook, entity) {

    // Get messages since last checked in

    var date;

    if (entity.field_users) {
        entity.field_users.forEach(function (value, index) {
            if (value.field_uid == thisHook.authPass.userid) {
                date = value.field_last_checked;
            }
        });

        if (!date) {
            // If there is no last checked date, make it really old to fetch all messages.
            date = 0;
        }

        var fetch = {
            entities: ['message'],
            'queries': [{
                field: 'field_created',
                operator: 'gt',
                value: date
            },
                {
                    field: 'groups',
                    operator: 'INCLUDES',
                    value: entity.eid
                }
            ]
        }
        iris.hook("hook_entity_fetch", thisHook.authPass, null, fetch).then(function (messages) {

            if (messages) {
                entity.unread = messages.length;
            }
            thisHook.finish(true, entity);

        }, function (fail) {

            iris.log("error", fail);
            thisHook.finish(false, fail);

        });
    } else {
        thisHook.finish(true, entity);
    }

});

iris.modules.groups.registerHook("hook_user_login", 0, function (thisHook, uid) {


    var fetch = {
        entities: ['user'],
        'queries': [{
            field: 'field_external_id',
            operator: 'IS',
            value: uid
        }
        ]
    }
    iris.hook("hook_entity_fetch", thisHook.authPass, null, fetch).then(function (user) {


        iris.hook("hook_entity_edit", 'root', user[0], user[0]).then(function (success) {

            thisHook.finish(true, success);
        }, function (fail) {

            thisHook.finish(false, fail);
        });
    });


    //thisHook.finish(true, data);
});

iris.modules.groups.registerHook("hook_user_logout", 0, function (thisHook, uid) {

    var fetch = {
        entities: ['user'],
        'queries': [{
            field: 'field_external_id',
            operator: 'IS',
            value: uid
        }
        ]
    }
    iris.hook("hook_entity_fetch", thisHook.authPass, null, fetch).then(function (user) {

        iris.hook("hook_entity_edit", 'root', user[0], user[0]).then(function (success) {

            thisHook.finish(true, uid);
        }, function (fail) {

            thisHook.finish(false, fail);
        });
    });

});

iris.modules.groups.registerHook("hook_entity_view_user", 0, function (thisHook, user) {

    if (iris.modules.auth.globals.userList[user.field_external_id]) {
        user.online = true;
    }
    else if (user.online) {
        delete user.online;
    }

    thisHook.finish(true, user);
});
