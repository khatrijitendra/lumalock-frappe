// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt

frappe.provide("frappe.tools");

frappe.tools.downloadify = function(data, roles, title) {
	if(roles && roles.length && !has_common(roles, user_roles)) {
		msgprint(__("Export not allowed. You need {0} role to export.", [frappe.utils.comma_or(roles)]));
		return;
	}

	var csv_data = frappe.tools.to_csv(data);

	// Used Blob object, because it can handle large files
	var blob_object = new Blob([csv_data], { type: 'text/csv' });
	var blob_url = URL.createObjectURL(blob_object);

	var a = document.createElement('a');
	a.download = title + '.csv';
	a.href = blob_url;

	document.body.appendChild(a);
	a.click();

	document.body.removeChild(a);
};

frappe.markdown = function(txt) {
	if(!frappe.md2html) {
		frappe.require('assets/frappe/js/lib/markdown.js');
		frappe.md2html = new Showdown.converter();
	}

	while(txt.substr(0,1)==="\n") {
		txt = txt.substr(1);
	}

	// remove leading tab (if they exist in the first line)
	var whitespace_len = 0,
		first_line = txt.split("\n")[0];

	while([" ", "\n", "\t"].indexOf(first_line.substr(0,1))!== -1) {
		whitespace_len++;
		first_line = first_line.substr(1);
	}

	if(whitespace_len && whitespace_len != first_line.length) {
		var txt1 = [];
		$.each(txt.split("\n"), function(i, t) {
			txt1.push(t.substr(whitespace_len));
		})
		txt = txt1.join("\n");
	}

	return frappe.md2html.makeHtml(txt);
}


frappe.tools.to_csv = function(data) {
	var res = [];
	$.each(data, function(i, row) {
		row = $.map(row, function(col) {
			return typeof(col)==="string" ? ('"' + col.replace(/"/g, '""') + '"') : col;
		});
		res.push(row.join(","));
	});
	return res.join("\n");
};

frappe.slickgrid_tools = {
	get_view_data: function(columns, dataView, filter) {
		var col_row = $.map(columns, function(v) { return v.name; });
		var res = [];
		var col_map = $.map(columns, function(v) { return v.field; });

		for (var i=0, len=dataView.getLength(); i<len; i++) {
			var d = dataView.getItem(i);
			var row = [];
			$.each(col_map, function(i, col) {
				var val = d[col];
				if(val===null || val===undefined) {
					val = "";
				}
				row.push(val);
			});

			if(!filter || filter(row, d)) {
				res.push(row);
			}
		}
		return [col_row].concat(res);
	},
	add_property_setter_on_resize: function(grid) {
		grid.onColumnsResized.subscribe(function(e, args) {
			$.each(grid.getColumns(), function(i, col) {
				if(col.docfield && col.previousWidth != col.width &&
					!in_list(frappe.model.std_fields_list, col.docfield.fieldname) ) {
					frappe.call({
						method:"frappe.client.make_width_property_setter",
						args: {
							doc: {
								doctype:'Property Setter',
								doctype_or_field: 'DocField',
								doc_type: col.docfield.parent,
								field_name: col.docfield.fieldname,
								property: 'width',
								value: col.width,
								"__islocal": 1
							}
						}
					});
					col.previousWidth = col.width;
					col.docfield.width = col.width;
				}
			});
		});
	}
};
