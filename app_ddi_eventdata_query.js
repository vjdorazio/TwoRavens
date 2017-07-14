// Right panel of subsetting menu


// This is the data format for
    // {
    //     name: 'Root',
    //     operation: 'and',        // If exists, have a logical drop down
    //     children: [],            // If exists, have a triangle expander
    //     negate: false            // If exists, have a negation button
    //     cancellable: false       // If exists and false, disable the delete button
    // }

var data = [
    {
        name: 'Root',
        operation: 'and',
        children: [],
        cancellable: false
    }
];

function togglebutton(id){
    return ' <button id="boolToggle" href="#node-'+ id +'" class="btn btn-primary btn-xs active" type="button" data-toggle="button" aria-pressed="true" data-node-id="'+
        id +'">not</button>'
}

function logicbutton(id){
    logDropdown =  ' <div class="dropdown" style="display:inline;"><button class="btn btn-primary dropdown-toggle btn-xs" type="button" data-toggle="dropdown"> and <span class="caret"></span></button>';
    logDropdown += '<ul class="dropdown-menu dropdown-menu-right" id="addDropmenu" style="float:left;margin:0;padding:0;width:45px;min-width:45px">' +
        '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="1">and </a></li>' +
        '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="2">or </a></li>' +
        '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="1">nand </a></li>' +
        '<li style="margin:0;padding:0;width:45px"><a style="margin:0;height:20px;padding:2px;width:43px!important" data-addsel="2">nor </a></li>' +
        '</ul></div>';
    return logDropdown
}

function cancelButton(id){
    return "<button type='button' class='btn btn-primary btn-xs' style='background:none;border:none;box-shadow:none;float:right;margin-top:3px' onclick='this.parentElement.remove()'><span class='glyphicon glyphicon-remove' style='color:#ADADAD'></span></button></div>";
}

$(function() {
    $('#queryTree').tree({
        data: data,
        dragAndDrop:true,
        autoOpen:true,
        selectable:false,
        onCreateLi: function(node, $li) {
            // Append a link to the jqtree-element div.
            // The link has an url '#node-[id]' and a data property 'node-id'.
            if ('operation' in node) {
                $li.find('.jqtree-element').append(logicbutton(node.id));
            }
            if ('negate' in node) {
                $li.find('.jqtree-element').append(togglebutton(node.id));
            }
            if (!('cancellable' in node) || (node['cancellable'] === true)) {
                $li.find('.jqtree-element').append(cancelButton(node.id));
            }
        }
    });
});

$('#queryTree').on(
    'tree.move',
    function(event)
    {
        event.preventDefault();
        event.move_info.do_move();
        // $.post('your_url', {tree: $(this).tree('toJson')});
    }
);

function addGroup(parent){

}

function addRule(){
    // Index zero is root node. Add subset pref to nodes
    if (subsetSelection !== "") {
        data[0]['children'].push(getSubsetPreferences());
        $('#queryTree').tree('loadData', data);
    }
}

/**
 * When a new rule is added, retrieve the preferences of the current subset panel
 * @returns {{}} : dictionary of preferences
 */
function getSubsetPreferences(){
    if (subsetSelection == 'Date') {
        var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June",
            "July", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        return {
            name: 'Date Subset',
            operation: 'and',
            children: [
                {
                    name: 'From: ' + monthNames[dateminUser.getMonth()] + ' ' + String(dateminUser.getFullYear()),
                    negate: false,
                    fromDate: dateminUser
                },
                {
                    name: 'To:   ' + monthNames[datemaxUser.getMonth()] + ' ' + String(datemaxUser.getFullYear()),
                    negate: false,
                    toDate: datemaxUser
                }
            ]
        };
    }
    if (subsetSelection == 'Location'){
        // TODO: Retrieve country listing from location panel, wrap in dictionary
        return {}
    }
    if (subsetSelection == 'Action'){
        return {}
    }
    if (subsetSelection == 'Actor'){
        // TODO: Retrieve actor preferences from actor panel
        return {}
    }
}

/**
 * Organizes all rightpanel modifiers and stored dictionaries into a single list of rules
 * @param node: root DOM element of the rightpanel SQL div tree
 * @returns {Array}
 */
function buildQuery(node) {

    var children = node.childNodes;
    var query = [];

    for (var i = 0; i < children.length; i++){

        if (children[i].id === 'rule'){
            // subsetData is recalled from subsetDicts with the index of the data-subset attribute
            query.push({
                type: 'rule',
                boolState: $(children[i].querySelector("#boolToggle")).hasClass('active'),
                logState: $(children[i].querySelector("#logToggle")).hasClass('active'),
                subsetData: subsetDicts[parseInt(children[i].getAttribute('data-subset'))]
            });
        }

        if (children[i].id === 'group'){
            query.push({
                type: 'group',
                data: buildQuery(children[i])
            });
        }
    }
    return query;
}
