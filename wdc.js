(function () {
    myConnector = tableau.makeConnector();

    myConnector.getSchema = function (schemaCallback) {
        var tableSchema = {
                id: 'tableautrackerid',
                alias: 'Tableau Tracker',
                columns: []
            },
            userMetadata = JSON.parse(tableau.connectionData).userMetadata;

        var columns = [{
            id: 'sourceSequenceId',
            dataType: tableau.dataTypeEnum.string
        }, {
            id: 'kind',
            dataType: tableau.dataTypeEnum.string
        }, {
            id: 'data_minValue_formattedValue',
            dataType: tableau.dataTypeEnum.string
        }, {
            id: 'data_minValue_value',
            dataType: tableau.dataTypeEnum.float
        }, {
            id: 'data_fieldName',
            dataType: tableau.dataTypeEnum.string
        }, {
            id: 'data_includeNullVales',
            dataType: tableau.dataTypeEnum.bool
        }, {
            id: 'data_maxValue_formattedValue',
            dataType: tableau.dataTypeEnum.string
        }, {
            id: 'data_maxValue_value',
            dataType: tableau.dataTypeEnum.float
        }, {
            id: 'data_document_referer',
            dataType: tableau.dataTypeEnum.string
        }, {
            id: 'data_document_location',
            dataType: tableau.dataTypeEnum.string
        }, {
            id: 'data_sheet',
            dataType: tableau.dataTypeEnum.string
        }, {
            id: 'data_window_width',
            dataType: tableau.dataTypeEnum.int
        }, {
            id: 'data_window_height',
            dataType: tableau.dataTypeEnum.int
        }, {
            id: 'data_filterType',
            dataType: tableau.dataTypeEnum.string
        }, {
            id: 'data_isExcludeMode',
            dataType: tableau.dataTypeEnum.bool
        }, {
            id: 'data_appliedValues_formattedValue',
            dataType: tableau.dataTypeEnum.string
        }, {
            id: 'data_appliedValues_value',
            dataType: tableau.dataTypeEnum.string
        }, {
            id: 'data_settings_deploymentId',
            dataType: tableau.dataTypeEnum.string
        }, {
            id: 'dashboardName',
            dataType: tableau.dataTypeEnum.string
        }, {
            id: 'deploymentId',
            dataType: tableau.dataTypeEnum.string
        }, {
            id: 'sourceId',
            dataType: tableau.dataTypeEnum.string
        }, {
            id: 'recordedAt',
            dataType: tableau.dataTypeEnum.datetime
        }, {
            id: 'workbookName',
            dataType: tableau.dataTypeEnum.string
        }];

        for(var idx = 0; idx < userMetadata.length; idx += 1) {
            if (userMetadata[idx]) {
                columns.push({
                    id: 'custom_' + formatId(userMetadata[idx]),
                    dataType: tableau.dataTypeEnum.string
                });
            }
        }

        tableSchema.columns = columns;

        schemaCallback([tableSchema]);
    };

    function formatId(id) {
        return id.replace(/[^a-zA-Z0-9]+/g,"_");
    }

    myConnector.getData = function (table, doneCallback) {
        var connData = JSON.parse(tableau.connectionData),
            deploymentId = connData.deploymentId,
            adminKey = connData.adminKey,
            workbookName = connData.workbook,
            path_origin = config.base_url + '/events/tableau-events?deploymentId=' + deploymentId + '&adminKey=' + adminKey + '&limit=' + config.limit,
            noValue = '-',
            getAllData,
            fillTable,
            getValue;
        if (workbookName) path_origin = path_origin + '&workbookName=' + workbookName

        getValue = function (root, pathToProperty, noValue) {
            var parent = root,
                properties = pathToProperty.split('.');
            for (var i = 0, len = properties.length; i < len; i += 1) {
                if (parent[properties[i]] !== undefined) {
                    parent = parent[properties[i]];
                } else {
                    return noValue
                }
            }
            return parent;
        };

        getAllData = function getAllData(path, offset) {
            var jqxhr = $.getJSON(path + '&offset=' + offset, function(resp) {
                var count = resp.events.length;

                if (count > 0) fillTable(resp.events)
                if (count === config.limit) {
                    getAllData(path_origin, ++offset);
                } else {
                    doneCallback();
                }
            });

        };


        fillTable = function (items) {
            var tableData = [];

            // Iterate over the JSON object
            for (var i = 0, leni = items.length; i < leni; i += 1) {
                var rowBasic = {
                    'sourceSequenceId': items[i].sourceSequenceId,
                    'kind': items[i].kind,
                    'deploymentId': items[i].deploymentId,
                    'dashboardName': items[i].dashboardName,
                    'sourceId': items[i].sourceId,
                    'recordedAt': items[i].recordedAt,
                    'workbookName': items[i].workbookName,

                    'data_fieldName': items[i].data.fieldName,
                    'data_includeNullVales': items[i].data.includeNullValues,
                    'data_document_referer': items[i].data.document.referer,
                    'data_document_location': items[i].data.document.location,
                    'data_sheet': items[i].data.sheet,
                    'data_window_width': items[i].data.window.width,
                    'data_window_height': items[i].data.window.height,
                    'data_filterType': items[i].data.filterType,

                    'data_minValue_formattedValue': getValue(items[i], 'data.minValue._formattedValue', noValue),
                    'data_minValue_value': getValue(items[i], 'data.minValue._value', noValue),
                    'data_maxValue_formattedValue': getValue(items[i], 'data.maxValue._formattedValue', noValue),
                    'data_maxValue_value': getValue(items[i], 'data.minValue._value', noValue),

                    'data_isExcludeMode': items[i].data.isExcludeMode,
                    // 'data_settings_deploymentId': getValue(items[i], 'data.settings.deploymentId', noValue)
                };

                if (items[i].data.appliedValues && items[i].data.appliedValues.length > 0) {
                    for (var j = 0, lenj = items[i].data.appliedValues.length; j < lenj; j += 1) {
                        var row = JSON.parse(JSON.stringify(rowBasic)),
                            userMetadata = JSON.parse(getValue(items[i], 'data.settings.userMetadata', '{}'));

                        row['data_appliedValues_formattedValue'] = items[i].data.appliedValues[j]._formattedValue;
                        row['data_appliedValues_value'] = items[i].data.appliedValues[j]._value;

                        for(var key in userMetadata) {
                            if (userMetadata.hasOwnProperty(key)) {
                                row['custom_' + formatId(key)] = userMetadata[key];
                            }
                        }

                        tableData.push(row);
                    }
                } else {
                    var row = JSON.parse(JSON.stringify(rowBasic)),
                        userMetadata = JSON.parse(getValue(items[i], 'data.settings.userMetadata', '{}'));

                    for(var key in userMetadata) {
                        if (userMetadata.hasOwnProperty(key)) {
                            row['custom_' + formatId(key)] = userMetadata[key];
                        }
                    }

                    tableData.push(row);
                }
            }
            table.appendRows(tableData);
        };

        getAllData(path_origin, 0);
    };

    tableau.registerConnector(myConnector);
})();