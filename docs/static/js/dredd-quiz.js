/* Utility functions */

function titleCase(str) {
    return str.split(' ').map(function(val){
	return val.charAt(0).toUpperCase() + val.substr(1).toLowerCase();
    }).join(' ');
}

/* https://plainjs.com/javascript/ajax/serialize-form-data-into-an-array-46/ */
function serializeArray(form) {
    var field, l, s = [];
    if (typeof form == 'object' && form.nodeName == "FORM") {
	var len = form.elements.length;
	for (var i=0; i<len; i++) {
	    field = form.elements[i];
	    if (field.name && !field.disabled && field.type != 'file' && field.type != 'reset' && field.type != 'submit' && field.type != 'button') {
		if (field.type == 'select-multiple') {
		    l = form.elements[i].options.length;
		    for (j=0; j<l; j++) {
			if(field.options[j].selected)
			    s[s.length] = { name: field.name, value: field.options[j].value };
		    }
		} else if ((field.type != 'checkbox' && field.type != 'radio') || field.checked) {
		    s[s.length] = { name: field.name, value: field.value };
		}
	    }
	}
    }
    return s;
}

/* AJAX functions */

function requestJSON(url, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
	if (request.readyState == 4 && request.status == 200) {
	    callback(JSON.parse(request.responseText));
	}
    }

    request.open('GET', url, true);
    request.send();
}

function generateJSON() {
    var responses = {};

    serializeArray(document.getElementById('quiz-form')).map(function(response){
	if (response.name in responses && !(responses[response.name] instanceof Array)) {
	    responses[response.name] = [responses[response.name], response.value];
	} else {
	    if (responses[response.name] instanceof Array) {
		responses[response.name].push(response.value);
	    } else {
		responses[response.name] = response.value;
	    }
	}
    });

    var text  = JSON.stringify(responses, null, 2);
    var lines = text.split('\n')

    document.getElementById('quiz-responses').innerHTML = `<textarea class="form-control" rows="${lines.length}" cols="80">${text}</textarea>`;
}

function submitQuiz(quiz_url) {
    // take take the key element from generateJSON()
    var responses = {};
    var dr = document.getElementById('dredd-response');
    dr.innerHTML = '';

    serializeArray(document.getElementById('quiz-form')).map(function(response){
	if (response.name in responses && !(responses[response.name] instanceof Array)) {
	    responses[response.name] = [responses[response.name], response.value];
	} else {
	    if (responses[response.name] instanceof Array) {
		responses[response.name].push(response.value);
	    } else {
		responses[response.name] = response.value;
	    }
	}
    });

    // first, erase the innerHTML of the JSON box
    document.getElementById('quiz-responses').innerHTML = ``;
    var assignment_name = quiz_url.split('/')[2].split('.')[0]
    var url = 'https://dredd.h4x0r.space/quiz/cse-30872-su26/' + assignment_name;
    fetch(url, {
	body: JSON.stringify(responses),
	method: 'POST'
    })
	.then(res => res.json())
	.then(data => {
	    // data now contains JSON from dredd
	    dr.innerHTML += `Checking ${assignment_name} quiz ...\n`;
	    for (const question in data) {
		if (question === 'score' || question === 'value' || question === 'status' || question === 'points') {
		    continue;
		}
		dr.innerHTML += (`${titleCase(question).padStart(8, " ")} ${String(data[question].toFixed(2)).padStart(5, " ")} / ${String(data['points'][question].toFixed(2)).padStart(5, " ")}\n`);
	    }
	    dr.innerHTML += "  --------------------\n";
	    dr.innerHTML += `   Score ${String(data['score'].toFixed(2)).padStart(5, " ")} / ${String(data['value'].toFixed(2)).padStart(5, " ")}\n`;
	    dr.innerHTML += `   Grade ${String((data['score'].toFixed(2) / data['value']).toFixed(2)).padStart(5, " ")} /  1.00\n`;
	    dr.innerHTML += `  Status ${!data['status'] ? "Success" : "Failure"}`;
	    // show the results
	    document.getElementById('dr-container').style.display = 'block';
	});
}

function loadQuiz(quiz_url) {
    requestJSON(quiz_url, function(data) {
	var html = ['<form class="flex-col" id="quiz-form"><ol>']

	Object.keys(data).sort().forEach(function(question) {
	    html.push(`<li><div class="form-group">${data[question].question}`);

	    if (data[question].type == 'single') {
		for (var response in data[question].responses) {
		    html.push('<div class="radio"><label>');
		    html.push(`<input type="radio" name="${question}" value="${response}"><p>${data[question].responses[response]}</p>`);
		    html.push('</label></div>');
		}
	    } else if (data[question].type == 'multiple') {
		for (var response in data[question].responses) {
		    html.push('<div class="checkbox"><label>');
		    html.push(`<input type="checkbox" name="${question}" value="${response}"><p>${data[question].responses[response]}</p>`);
		    html.push('</label></div>');
		}
	    } else if (data[question].type == 'order') {
		for (var response1 in data[question].responses) {
		    html.push(`<div class="form-group"><select name="${question}" class="form-control">`);
		    for (var response2 in data[question].responses) {
			var selected = (response1 == response2) ? "selected" : "";
			html.push(`<option value="${response2}" ${selected}>${data[question].responses[response2]}</option>`);
		    }
		    html.push('</select></div>');
		}
	    } else if (data[question].type == 'blank') {
		var blanks = data[question].question.split('____');
		html.push('<ol>');
		for (var i = 1; i < blanks.length; i++) {
		    html.push(`<li><input type="text" name="${question}"></li>`);
		}
		html.push('</ol>');
	    }

	    html.push('</div></li>');
	});
	html.push('</ol>');

	html.push(`<div class="text-right"><button type="button" class="btn btn-primary" style="margin-right: 10px !important" onclick="generateJSON()">Generate</button><button type="button" class="btn btn-primary" onclick="submitQuiz('${quiz_url}')">Check</button></div>`);
	html.push('<br></form>');

	document.getElementById('quiz-questions').innerHTML = html.join('');
    });
}
