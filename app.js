//Validation check for fields
function validateFields() {
    var validates = Array.from(document.getElementsByClassName('validable'));
    validates.forEach(function (input) {
        input.classList.add("is-invalid");
        input.addEventListener('input', function (e) {
            if (e.target.value) {
                input.classList.remove("is-invalid");
            } else {
                input.classList.add("is-invalid");
            }

        })
    })
}

function renderError(msg) {
    $('#error-msg').text(msg);
    $('#error').fadeIn();
}

function hideError() {
    $('#error-msg').text(null)
    $('#error').fadeOut();
}

function validateCredentials(success) {
    var deploymentId = document.getElementById('deployment-id').value;
    var adminKey = document.getElementById('admin-key').value;
    var req = new XMLHttpRequest();
    req.open('POST',config.base_url + "/events/validate");
    req.setRequestHeader('Content-Type','application/json; charset=utf-8');
    req.send(JSON.stringify({ deploymentId: deploymentId, adminKey: adminKey }));
    req.onload = function (){
        if(req.status >= 200 && req.status < 300){
            success();
        }
        else {
            renderError(req.response);
        }
    };
}

function formIsValid() {
    return document.getElementById('deployment-id').value && document.getElementById('admin-key').value;
}

function refillDataIfExists() {
    if(tableau.phase && tableau.phase === 'interactive'){
        if(tableau.connectionData){
            var data = JSON.parse(tableau.connectionData);
            var toBeCheckedFields = {deploymentId: "deployment-id", workbook: "workbook-name", userMetadata: "custom-metadata-fields"}
            for (var key in toBeCheckedFields) {
                if(data[key]) {
                    var field = document.getElementById(toBeCheckedFields[key]);
                    field.value = data[key].toString();
                    field.classList.remove("is-invalid");
                }
            }
        }
    } else {
        setTimeout(refillDataIfExists, 250)
    }
}

$(document).ready(function () {


    $("#submitButton").click(function () {
        if(formIsValid()){
            validateCredentials(function () {
                hideError();
                tableau.connectionName = "Connector";
                tableau.connectionData = JSON.stringify({
                    deploymentId: document.getElementById('deployment-id').value,
                    adminKey: document.getElementById('admin-key').value,
                    workbook: document.getElementById('workbook-name').value,
                    userMetadata: document.getElementById('custom-metadata-fields').value.split(',').map(function(val) { return val.trim(); })
                });
                tableau.submit();
            });
        }
    });

    validateFields();
    refillDataIfExists();
});