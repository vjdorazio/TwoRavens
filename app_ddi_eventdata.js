//////////
// Globals

// hostname default - the app will use it to obtain the variable metadata
// (ddi) and pre-processed data info if the file id is supplied as an
// argument (for ex., gui.html?dfId=17), but hostname isn't.
// Edit it to suit your installation.
// (NOTE that if the file id isn't supplied, the app will default to the
// local files specified below!)
// NEW: it is also possible now to supply complete urls for the ddi and
// the tab-delimited data file; the parameters are ddiurl and dataurl.
// These new parameters are optional. If they are not supplied, the app
// will go the old route - will try to cook standard dataverse urls
// for both the data and metadata, if the file id is supplied; or the
// local files if nothing is supplied.
// -- L.A.

var production=false;
var private=false;

if(production && fileid=="") {
    alert("Error: No fileid has been provided.");
    throw new Error("Error: No fileid has been provided.");
}

var dataverseurl="";

if (hostname) {
    dataverseurl="https://"+hostname;
} else {
    if (production) {
        dataverseurl="%PRODUCTION_DATAVERSE_URL%";
    } else {
        dataverseurl="http://localhost:8080";
    }
}

if (fileid && !dataurl) {
    // file id supplied; we are going to assume that we are dealing with
    // a dataverse and cook a standard dataverse data access url,
    // with the fileid supplied and the hostname we have
    // either supplied or configured:
    dataurl = dataverseurl+"/api/access/datafile/"+fileid;
    dataurl = dataurl+"?key="+apikey;
    // (it is also possible to supply dataurl to the script directly,
    // as an argument -- L.A.)
}

if (!production) {
    // base URL for the R apps:
    var rappURL = "http://0.0.0.0:8000/custom/";
} else {
    var rappURL = "https://beta.dataverse.org/custom/"; //this will change when/if the production host changes
}


//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//This part of the code reads in the date-frequency csv file, and reads that data to show the distribution graph, and defines all the variables and functions for this
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

var logArray = [];


var tempWidth = d3.select("#main.left").style("width");
var width = tempWidth.substring(0,(tempWidth.length-2));


var height = $(window).height() -120;  // Hard coding for header and footer and bottom margin.


var forcetoggle=["true"];
var estimated=false;
var estimateLadda = Ladda.create(document.getElementById("btnEstimate"));
var selectLadda = Ladda.create(document.getElementById("btnSelect"));
var rightClickLast = false;


// this is the initial color scale that is used to establish the initial colors of the nodes.  allNodes.push() below establishes a field for the master node array allNodes called "nodeCol" and assigns a color from this scale to that field.  everything there after should refer to the nodeCol and not the color scale, this enables us to update colors and pass the variable type to R based on its coloring
var colors = d3.scaleOrdinal(d3.schemeCategory20);
//var colors = d3.scale.category20();

var colorTime=false;
var timeColor = '#2d6ca2';

var colorCS=false;
var csColor = '#419641';

var depVar=false;
var dvColor = '#28a4c9';

var nomColor = '#ff6600';

var subsetdiv=false;
var setxdiv=false;


var varColor = '#f0f8ff';   //d3.rgb("aliceblue");
var selVarColor = '#fa8072';    //d3.rgb("salmon");
var taggedColor = '#f5f5f5';    //d3.rgb("whitesmoke");
var d3Color = '#1f77b4';  // d3's default blue
var grayColor = '#c0c0c0';

var subsetSelection = "";
var selectedVariables = new Set();

// localStorage.removeItem('selectedVariables');

// Create the rightpanel data tree
if (localStorage.getItem("selectedVariables") !== null) {
    // If the user has already submitted a query, restore the previous query from local data
    selectedVariables = new Set(JSON.parse(localStorage.getItem('selectedVariables')));
}
var righttab = "btnModels"; // global for current tab in right panel

var zparams = {
    zdata: [],
    zedges: [],
    ztime: [],
    znom: [],
    zcross: [],
    zmodel: "",
    zvars: [],
    zdv: [],
    zdataurl: "",
    zsubset: [],
    zsetx: [],
    zmodelcount: 0,
    zplot: [],
    zsessionid: "",
    zdatacite: "",
    zmetadataurl: "",
    zusername: ""
};


// Radius of circle
var allR = 40;

//Width and height for histgrams
var barwidth = 1.3*allR;
var barheight = 0.5*allR;
var barPadding = 0.35;
var barnumber =7;


var arc0 = d3.arc()
.innerRadius(allR + 5)
.outerRadius(allR + 20)
.startAngle(0)
.endAngle(3.2);

var arc1 = d3.arc()
.innerRadius(allR + 5)
.outerRadius(allR + 20)
.startAngle(0)
.endAngle(1);

var arc2 = d3.arc()
.innerRadius(allR + 5)
.outerRadius(allR + 20)
.startAngle(1.1)
.endAngle(2.2);

var arc3 = d3.arc()
.innerRadius(allR + 5)
.outerRadius(allR + 20)
.startAngle(2.3)
.endAngle(3.3);

var arc4 = d3.arc()
.innerRadius(allR + 5)
.outerRadius(allR + 20)
.startAngle(4.3)
.endAngle(5.3);



// From .csv
var dataset2 = [];
var valueKey = [];
var variableSubsetKeys = ["Date","Location","Action","Actor"];
var lablArray = [];
var hold = [];
var allNodes = [];
var newallNodes=[];
var allResults = [];
var subsetNodes = [];
var links = [];
var nodes = [];
var transformVar = "";
var summaryHold = false;
var selInteract = false;
var modelCount = 0;
var callHistory = []; // unique to the space. saves transform and subset calls.
var citetoggle = false;


// transformation toolbar options
// var transformList = ["log(d)", "exp(d)", "d^2", "sqrt(d)", "interact(d,e)"];

// arry of objects containing allNode, zparams, transform vars
var spaces = [];
var trans = []; //var list for each space contain variables in original data plus trans in that space

// end of (most) global declarations (minus functions)


// collapsable user log
$('#collapseLog').on('shown.bs.collapse', function () {
    d3.select("#collapseLog div.panel-body").selectAll("p")
        .data(logArray)
        .enter()
        .append("p")
        .text(function (d) {
            return d;
        });
    //$("#logicon").removeClass("glyphicon-chevron-up").addClass("glyphicon-chevron-down");
});

$('#collapseLog').on('hidden.bs.collapse', function () {
    d3.select("#collapseLog div.panel-body").selectAll("p")
        .remove();
    //$("#logicon").removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-up");
});


// text for the about box
// note that .textContent is the new way to write text to a div
$('#about div.panel-body').text('TwoRavens v0.1 "Dallas" -- The Norse god Odin had two talking ravens as advisors, who would fly out into the world and report back all they observed.  In the Norse, their names were "Thought" and "Memory".  In our coming release, our thought-raven automatically advises on statistical model selection, while our memory-raven accumulates previous statistical models from Dataverse, to provide cumulative guidance and meta-analysis.'); //This is the first public release of a new, interactive Web application to explore data, view descriptive statistics, and estimate statistical models.";




//
// read DDI metadata with d3:
var metadataurl = "";
if (ddiurl) {
    // a complete ddiurl is supplied:
    metadataurl=ddiurl;
} else if (fileid) {
    // file id supplied; we're going to cook a standard dataverse
    // metadata url, with the file id provided and the hostname
    // supplied or configured:
    metadataurl=dataverseurl+"/api/meta/datafile/"+fileid;
} else {
    // neither a full ddi url, nor file id supplied; use one of the sample DDIs that come with the app, in the data directory:
    // metadataurl="data/qog137.xml"; // quality of government
    metadataurl="~/TwoRavens/data/fearonLaitin.xml"; // This is Fearon Laitin
    //metadataurl="data/PUMS5small-ddi.xml"; // This is California PUMS subset
    //metadataurl="data/BP.formatted-ddi.xml";
    //metadataurl="data/FL_insurance_sample-ddi.xml";
    //metadataurl="data/strezhnev_voeten_2013.xml";   // This is Strezhnev Voeten
    //metadataurl="data/19.xml"; // Fearon from DVN Demo
    //metadataurl="data/76.xml"; // Collier from DVN Demo
    //metadataurl="data/79.xml"; // two vars from DVN Demo
    //metadataurl="data/000.xml"; // one var in metadata
    //metadataurl="data/0000.xml"; // zero vars in metadata
}

// Reading the pre-processed metadata:
// Pre-processed data:
var pURL = "";

if (dataurl) {
    // data url is supplied
    pURL = dataurl+"&format=prep";
    console.log("TEst")

} else {
    // no dataurl/file id supplied; use one of the sample data files distributed with the app in the "data" directory:
    pURL="data/samplePhoxPreprocess.json";
    datepath="data/dateplot.csv";


    //This is testing whether a newer json file exists or not. if yes, we will use that file, else use the default file
   //var test=UrlExists(purltest);
   //if(test==true){
     // pURL = purltest;
     // console.log("test is true");
    //}
   //else
   	//pURL = "data/fearonLaitinpreprocess8.json";

  // console.log("yo value of test",test);
   /*$.ajax({
    url:purltest,
    type:'HEAD',
    error: function()
    {
    	console.log("error");
    	pURL = "data/fearonLaitinPreprocess4.json";
        //file not exists
    },
    success: function()
    {
    	console.log("success");
    	pURL = purltest;
        //file exists
    }
	});*/
		function UrlExists(url)
		{
		    var http = new XMLHttpRequest();
		    http.open('HEAD', url, false);
		    http.send();
		    return http.status!=404;
		}
    //console.log(purltest);
   // console.log(pURL);
}

 // .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");
var preprocess = {};
var mods = new Object;
// console.log("Value of username: ",username);

//This function finds whether a key is present in the json file, and sends the key's value if present.
function findValue(json, key) {
		 if (key in json) return json[key];
		 else {
			    var otherValue;
			    for (var otherKey in json) {
			      if (json[otherKey] && json[otherKey].constructor === Object) {
			        otherValue = findValue(json[otherKey], key);
			        if (otherValue !== undefined) return otherValue;
			      }
			    }
			  }
		}




//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//end of distribution graph

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++




//});


// this is the function and callback routine that loads all external data: metadata (DVN's ddi), preprocessed (for plotting distributions), and zeligmodels (produced by Zelig) and initiates the data download to the server
 readPreprocess(url=pURL, p=preprocess, v=null, callback=function(){
               //console.log(UrlExists(metadataurl));


               	//if(UrlExists(metadataurl)){
                //d3.xml(metadataurl, "application/xml", function(xml) {

 				//				  d3.json(url, function(error, json) {
                d3.json(url,function(json){

                   var jsondata=json;
                    // console.log(jsondata);
                     //console.log("Findvalue: ",findValue(jsondata,"fileName"));
                     //  var vars = xml.documentElement.getElementsByTagName("var");
                       var vars=jsondata.variables;
 					  //console.log("value of vars");
               //        console.log(vars);
                      // var temp = xml.documentElement.getElementsByTagName("fileName");
                       var temp = findValue(jsondata,"fileName");
                 //      console.log("value of temp");
                   //    console.log(temp);
                     //
                       zparams.zdata = temp;//[0].childNodes[0].nodeValue;
                     //  console.log("value of zdata: ",zparams.zdata);
                       // function to clean the citation so that the POST is valid json
                       function cleanstring(s) {
                         s=s.replace(/\&/g, "and");
                         s=s.replace(/\;/g, ",");
                         s=s.replace(/\%/g, "-");
                         return s;
                      }

                      // var cite = xml.documentElement.getElementsByTagName("biblCit");
                       var cite=findValue(jsondata,"biblCit");
                       zparams.zdatacite=cite;//[0].childNodes[0].nodeValue;
                      // console.log("value of zdatacite: ",zparams.zdatacite);
                       if(zparams.zdatacite!== undefined){
                         zparams.zdatacite=cleanstring(zparams.zdatacite);
                       }
                       //console.log("value of zdatacite: ",zparams.zdatacite);
                       //

                       // dataset name trimmed to 12 chars
                       var dataname = zparams.zdata.replace( /\.(.*)/, "") ;  // regular expression to drop any file extension
                       // Put dataset name, from meta-data, into top panel
                       d3.select("#dataName")
                       .html(dataname);

                       $('#cite div.panel-body').text(zparams.zdatacite);

                       // Put dataset name, from meta-data, into page title
                       d3.select("title").html("TwoRavens " +dataname)
                       //d3.select("#title").html("blah");

                       // temporary values for hold that correspond to histogram bins
                       hold = [.6, .2, .9, .8, .1, .3, .4];
                       var myvalues = [0, 0, 0, 0, 0];
                        //console.log("length: ",vars.length);
                       // console.log(vars);

 						//var tmp=vars.ccode;
 						//console.log("tmp= ",tmp);
 						var i=0;
 										for(var key in vars) {
 										//	console.log(vars[key]);
 							                //p[key] = jsondata["variables"][key];
 							                valueKey[i]=key;

 							                if(vars[key].labl.length===0){lablArray[i]="no label";}
 							                else{lablArray[i]=vars[key].labl;}


 							                i++;

 							            }
 							            //console.log("test=",ccode.labl.);
 					//console.log("lablArray=",lablArray);


                       for (i=0;i<valueKey.length;i++) {


                       //valueKey[i] = vars[i].attributes.name.nodeValue;

                       //if(vars[i].getElementsByTagName("labl").length === 0) {lablArray[i]="no label";}
                       //else {lablArray[i] = vars[i].getElementsByTagName("labl")[0].childNodes[0].nodeValue;}

                     //  var datasetcount = d3.layout.histogram()
                     //  .bins(barnumber).frequency(false)
                     //  (myvalues);

                       // this creates an object to be pushed to allNodes. this contains all the preprocessed data we have for the variable, as well as UI data pertinent to that variable, such as setx values (if the user has selected them) and pebble coordinates
                       var obj1 = {id:i, reflexive: false, "name": valueKey[i], "labl": lablArray[i], data: [5,15,20,0,5,15,20], count: hold, "nodeCol":colors(i), "baseCol":colors(i), "strokeColor":selVarColor, "strokeWidth":"1", "subsetplot":false, "subsetrange":["", ""],"setxplot":false, "setxvals":["", ""], "grayout":false};

                       jQuery.extend(true, obj1, preprocess[valueKey[i]]);
                       allNodesColors(obj1);

                       // console.log(vars[i].childNodes[4].attributes.type.ownerElement.firstChild.data);
                       allNodes.push(obj1);

                       };

                       //console.log("allNodes: ", allNodes);
                       // Reading the zelig models and populating the model list in the right panel.
                       d3.json("data/zelig5models.json", function(error, json) {
                               if (error) return console.warn(error);
                               var jsondata = json;

                               //console.log("zelig models json: ", jsondata);
                               for(var key in jsondata.zelig5models) {
                               if(jsondata.zelig5models.hasOwnProperty(key)) {
                               mods[jsondata.zelig5models[key].name[0]] = jsondata.zelig5models[key].description[0];
                               }
                               }

                               d3.json("data/zelig5choicemodels.json", function(error, json) {
                                       if (error) return console.warn(error);
                                       var jsondata = json;
                                       //console.log("zelig choice models json: ", jsondata);
                                       for(var key in jsondata.zelig5choicemodels) {
                                       if(jsondata.zelig5choicemodels.hasOwnProperty(key)) {
                                       mods[jsondata.zelig5choicemodels[key].name[0]] = jsondata.zelig5choicemodels[key].description[0];
                                       }
                                       }

                                       scaffolding();
                       //                dataDownload();
                                       });
                               });
                       });

                });


////////////////////////////////////////////
// everything below this point is a function
//+++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++








// scaffolding is called after all external data are guaranteed to have been read to completion. this populates the left panel with variable names, the right panel with model names, the transformation tool, an the associated mouseovers. its callback is layout(), which initializes the modeling space
function scaffolding(callback) {


    //jquery does this well
    $('#tInput').click(function() {
        var t = document.getElementById('transSel').style.display;
        if(t !== "none") { // if variable list is displayed when input is clicked...
            $('#transSel').fadeOut(100);
            return false;
        }
        var t1 = document.getElementById('transList').style.display;
        if(t1 !== "none") { // if function list is displayed when input is clicked...
            $('#transList').fadeOut(100);
            return false;
        }

        // highlight the text
        $(this).select();

        var pos = $('#tInput').offset();
        pos.top += $('#tInput').width();
        $('#transSel').fadeIn(100);
        return false;
        });

    $('#tInput').keyup(function(event) {
                       var t = document.getElementById('transSel').style.display;
                       var t1 = document.getElementById('transList').style.display;

                       if(t !== "none") {
                            $('#transSel').fadeOut(100);
                       } else if(t1 !== "none") {
                            $('#transList').fadeOut(100);
                       }

                       if(event.keyCode == 13){ // keyup on "Enter"
                            var n = $('#tInput').val();
                            var t = transParse(n=n);

                            transform(n=t.slice(0, t.length-1), t=t[t.length-1], typeTransform=false);
                       }
                    });

    $('#transList li').click(function(event) {
                             var tvar =  $('#tInput').val();

                             // if interact is selected, show variable list again
                             if($(this).text() === "interact(d,e)") {
                                $('#tInput').val(tvar.concat('*'));
                                selInteract = true;
                                $(this).parent().fadeOut(100);
                                $('#transSel').fadeIn(100);
                                event.stopPropagation();
                                return;
                             }

                            var tfunc = $(this).text().replace("d", "_transvar0");
                             var tcall = $(this).text().replace("d", tvar);
                             $('#tInput').val(tcall);
                            $(this).parent().fadeOut(100);
                             event.stopPropagation();
                             transform(n=tvar, t=tfunc, typeTransform=false);
                             });




//alert("scaffoldingflag"+flag);


eventlist=new Array(20)
    .join().split(',')
    .map(function(item, index){ return ++index;})

    // console.log(eventlist);
    //populating event type
		d3.select("#tab5").selectAll("p")
    .data(eventlist)
    .enter()
    .append("p")
    // .attr("id",function(d){
    //     return d.replace(/\W/g, "_"); // replace non-alphanumerics for selection purposes
    //     }) // perhapse ensure this id is unique by adding '_' to the front?
    .text(function(d){return d;})
    .style('background-color',function(d) {
         //if(findNodeIndex(d) > 2) {return varColor;}
         //else {
                return hexToRgba(selVarColor);
               })
    .attr("data-container", "body")
    .attr("data-toggle", "popover")
    .attr("data-trigger", "hover")
    .attr("data-placement", "center")
    .attr("data-html", "true")
    .attr("onmouseover", "$(this).popover('toggle');")
    .attr("onmouseout", "$(this).popover('toggle');")
    .attr("data-original-title", "Summary Statistics");

    // console.log(valueKey);
    d3.select("#variableList").selectAll("p") 			//do something with this..
        .data(valueKey)
        .enter()
        .append("p")
        .attr("id", function (d) {
            return d.replace(/\W/g, "_"); // replace non-alphanumerics for selection purposes
        }) // perhapse ensure this id is unique by adding '_' to the front?
        .text(function (d) {
            return d;
        })
        .style('background-color', function () {
            if (selectedVariables.has(d3.select(this).text())) {
                return hexToRgba(selVarColor)
            } else {
                return hexToRgba(varColor)
            }
        })
        .attr("data-container", "body")
        .attr("data-toggle", "popover")
        .attr("data-trigger", "hover")
        .attr("data-placement", "right")
        .attr("data-viewport", "{selector: '#body', padding: '62px'}")
        .attr("data-html", "true")
        .attr("onmouseover", "$(this).popover('toggle');")
        .attr("onmouseout", "$(this).popover('toggle');")
/*<<<<<<< HEAD
        .attr("data-original-title", "Summary Statistics")
        .on("click", function () {
            var variableName = d3.select(this).text();
            var currentColor = d3.select(this).style('background-color') == hexToRgba(varColor) ? hexToRgba(selVarColor) : hexToRgba(varColor);

            if (currentColor === hexToRgba(selVarColor)) {
                selectedVariables.add(variableName);
            } else {
                if (selectedVariables.has(variableName)) {
                    selectedVariables.delete(variableName);
                }
            }

            d3.select(this).style("background-color", currentColor);
            // This updates the listing in the right panel
            reloadVariables();
        });
=======*/
        .attr("data-original-title", "Summary Statistics");

//>>>>>>> Marcus_EventDataSubset


    d3.select("#tab2").selectAll("p") 			//do something with this..
    .data(variableSubsetKeys)
    .enter()
    .append("p")
    .attr("id",function(d){
          return d.replace(/\W/g, "_"); // replace non-alphanumerics for selection purposes
          }) // perhaps ensure this id is unique by adding '_' to the front?
    .text(function(d){return d;})
	.style("text-align", "center")
    .style('background-color', varColor)
    .attr("data-container", "body")
    .attr("data-toggle", "popover")
    .attr("data-trigger", "hover")
    .attr("data-placement", "right")
    .attr("data-html", "true")
    .on("click", function (){
        if(d3.select(this).text()=="Date") {
            document.getElementById("subsetDate").style.display = 'inline';

            document.getElementById("subsetLocation").style.display = 'none';
            document.getElementById("subsetActor").style.display = 'none';
            document.getElementById("subsetAction").style.display = 'none';

			selectionMadeSubset("Date");
            d3date();
            rightpanelMargin();
        }
        else if(d3.select(this).text()=="Location") {
            document.getElementById("subsetLocation").style.display = 'inline';

            document.getElementById("subsetDate").style.display = 'none';
            document.getElementById("subsetActor").style.display = 'none';
            document.getElementById("subsetAction").style.display = 'none';
			selectionMadeSubset("Location");
            d3loc();
            rightpanelMargin();
        }
        else if(d3.select(this).text()=="Actor") {
            document.getElementById("subsetActor").style.display = 'inline';

            document.getElementById("subsetDate").style.display = 'none';
            document.getElementById("subsetLocation").style.display = 'none';
            document.getElementById("subsetAction").style.display = 'none';
			selectionMadeSubset("Actor");
            d3actor();
            rightpanelMargin();
        }
        else if(d3.select(this).text()=="Action") {
            document.getElementById("subsetAction").style.display = 'inline';

            document.getElementById("subsetDate").style.display = 'none';
            document.getElementById("subsetLocation").style.display = 'none';
            document.getElementById("subsetActor").style.display = 'none';
			selectionMadeSubset("Action");
            d3action();
            rightpanelMargin();
        }
        });


    function selectionMadeSubset(n) {
        subsetSelection = n;

        d3.select("#tab2").selectAll("p").style('background-color',function(d) {
            if(d==n)
                return hexToRgba(selVarColor);
            else
                return varColor;
        })
    }


    d3.select("#models")
    .style('height', 2000)
    .style('overfill', 'scroll');

    var modellist = Object.keys(mods);

    d3.select("#models").selectAll("p")
    .data(modellist)
    .enter()
    .append("p")
    .attr("id", function(d){
          return "_model_".concat(d);
          })
    .text(function(d){return d;})
    .style('background-color',function(d) {
           return varColor;
           })
    .attr("data-container", "body")
    .attr("data-toggle", "popover")
    .attr("data-trigger", "hover")
    .attr("data-placement", "top")
    .attr("data-html", "true")
    .attr("onmouseover", "$(this).popover('toggle');")
    .attr("onmouseout", "$(this).popover('toggle');")
    .attr("data-original-title", "Model Description")
    .attr("data-content", function(d){
          return mods[d];
          });

    if(typeof callback === "function") {
        callback(); // this calls layout() because at this point all scaffolding is up and ready
    }
    populatePopover();
}

$("#searchvar").ready(function(){
	$("#searchvar").val('');

});

	//Rohit Bhattacharjee
   //to add a clear button in the search barS

 function tog(v){
	return v?'addClass':'removeClass';
}

$(document).on('input', '#searchvar', function() {
    $(this)[tog(this.value)]('x');
}).on('mousemove', '.x', function(e) {
    $(this)[tog(this.offsetWidth-18 < e.clientX-this.getBoundingClientRect().left)]('onX');
}).on('click', '.onX', function(){
    $(this).removeClass('x onX').val('').focus();
	updatedata(valueKey,0);
});


	var srchid=[];
	var vkey=[];
	$("#searchvar").on("keyup",function search(e) {
    //if(e.keyCode == 8 ) {
		//d3.select("#tab1").selectAll("p")

		$("#tab1").children().popover('hide');
	//}
	var flag=0;
		var k=0;
		  vkey=[];
		 srchid=[];

		 if($(this).val()===''){
			srchid=[];
			flag=0;
			updatedata(valueKey,flag);
			return;
		}

		for(var i=0;i<allNodes.length;i++)
		{
			if((allNodes[i]["name"].indexOf($(this).val())!=-1))
			{
				srchid[k]=i;

			k=k+1;}
		}
		for(var i=0;i<allNodes.length;i++)
		{
			if((allNodes[i]["labl"].indexOf($(this).val())!=-1) && ($.inArray(i, srchid)==-1))
			{

				srchid[k]=i;

			k=k+1;}
		}

		//console.log(srchid);
		lngth=srchid.length;

                       
	if(k==0){
			vkey=valueKey;

	}
	else{

				flag=1;
				vkey=[];

				k=0;
				var i=0;
				for( i=0;i<srchid.length;i++)	{
					vkey[i]=valueKey[srchid[i]];

				}

				for(var j=0;j<valueKey.length;j++){

					if($.inArray(valueKey[j],vkey)==-1){
							vkey[i]=valueKey[j];
							i++;
					}

				}
				}



	updatedata(vkey,flag);

});

	function updatedata(value,flag)
	{
	var clr='#000000' ;

	var nodename=[];
	var bordercol='#000000';
	var borderstyle='solid';
	for(var i=0;i<nodes.length;i++)
	{
		nodename[i]=nodes[i].name;
	}

	d3.select("#variableList").selectAll("p").data(valueKey).remove();

	d3.select("#variableList").selectAll("p")
		//do something with this..

		.data(value)
		.enter()
		.append("p")
		.attr("id",function(d){
			  return d.replace(/\W/g, "_"); // replace non-alphanumerics for selection purposes
			  }) // perhapse ensure this id is unique by adding '_' to the front?
		.text(function(d){return d;})
		.style('background-color',function(d) {
			  if($.inArray(findNode(d).name,nodename)==-1) {return varColor;}

			   else {return hexToRgba(selVarColor);}
			   }).style('border-style',function(d){
				   if($.inArray(findNodeIndex(d),srchid)!=-1 && flag==1){return borderstyle;}
			   })
			   .style('border-color',function(d){
				   if($.inArray(findNodeIndex(d),srchid)!=-1 && flag==1){return bordercol;}
			   })
    .attr("data-container", "body")
    .attr("data-toggle", "popover")
    .attr("data-trigger", "hover")
    .attr("data-placement", "right")
    .attr("data-html", "true")
    .attr("onmouseover", "$(this).popover('toggle');")
    .attr("onmouseout", "$(this).popover('toggle');")
    .attr("data-original-title", "Summary Statistics");

    var nodename = [];
    var bordercol = '#000000';
    var borderstyle = 'solid';
    for (var i = 0; i < nodes.length; i++) {
        nodename[i] = nodes[i].name;
    }

	$("#tab1").children().popover('hide');
	populatePopover();

        //Mike had previously commented this line out
	addlistener(nodes);


	}

//
//
// var circle = svg.append('svg:g').selectAll('g');
//  var path = svg.append('svg:g').selectAll('path');
//
//
// 	// line displayed when dragging new nodes
//
//
// 	//ROHIT BHATTACHARJEE
// 	// mouse event vars
//         var selected_node = null,
//         selected_link = null,
//         mousedown_link = null,
//         mousedown_node = null,
//         mouseup_node = null;
// var force;



        $(document).ready(function(){

        		$("#btnSave").hide();
        });




  //Write to JSON Function, to write new metadata file after the user has tagged a variable as a time variable
	function writetojson(btn){

		//var jsonallnodes=JSON.stringify(allNodes);

    var outtypes = [];
    for (var j = 0; j < allNodes.length; j++) {
        outtypes.push({
            varnamesTypes: allNodes[j].name,
            nature: allNodes[j].nature,
            numchar: allNodes[j].numchar,
            binary: allNodes[j].binary,
            interval: allNodes[j].interval,
            time: allNodes[j].time
        });
    }


   // console.log("Outtypes:"+outtypes);
		writeout={outtypes:outtypes}
				writeoutjson=JSON.stringify(writeout);
				//console.log(jsonallnodes);
				urlcall = rappURL+"writeapp";

				//base.concat(jsonout);
    	function cleanstring(s) {
                        s=s.replace(/\&/g, "and");
                        s=s.replace(/\;/g, ",");
                        s=s.replace(/\%/g, "-");
                        return s;
                      }
                      var properjson=cleanstring(writeoutjson);

    var solajsonout = "solaJSON="+properjson;
//console.log(properjson);

function writesuccess(btn,json){

	selectLadda.stop();

      $('#btnSave').hide();
}

function writefail(btn)
{
	selectLadda.stop();

    var properjson = cleanstring(writeoutjson);

    var solajsonout = "solaJSON=" + properjson;
    //console.log(properjson);

    function writesuccess(btn, json) {
        selectLadda.stop();
        $('#btnSave').hide();
    }

    function writefail(btn) {
        selectLadda.stop();

    }

    selectLadda.start();
    makeCorsRequest(urlcall, btn, writesuccess, writefail, solajsonout);
    }
}//end of write to json

		// init D3 force layout
		function forced3layout(nodes, links,  width,  height,tick)
        {
		var force = d3.layout.force()
        .nodes(nodes)
        .links(links)
        .size([width, height])
        .linkDistance(150)
        .charge(-800)
        .on('tick',tick);  // .start() is important to initialize the layout

		return force;
		}

		function resetMouseVars() {
            mousedown_node = null;
            mouseup_node = null;
            mousedown_link = null;
        }

	//ROHIT BHATTACHARJEE ad listener function
	function addlistener(nodes){
	d3.select("#variableList").selectAll("p")
    .on("mouseover", function(d) {

		// REMOVED THIS TOOLTIP CODE AND MADE A BOOTSTRAP POPOVER COMPONENT
        $("body div.popover")
        .addClass("variables");
        $("body div.popover div.popover-content")
        .addClass("form-horizontal");
         })
    .on("mouseout", function() {

										//Remove the tooltip
											//d3.select("#tooltip").style("display", "none");
        })
     
    .on("click", function varClick(){
        if(allNodes[findNodeIndex(this.id)].grayout) {return null;}

        d3.select(this)
        .style('background-color',function(d) {
               var myText = d3.select(this).text();
               var myColor = d3.select(this).style('background-color');
               var mySC = allNodes[findNodeIndex(myText)].strokeColor;
               var myNode = allNodes[findNodeIndex(this.id)];

               	//console.log("inside SC wala if");
               //	SC=timeColor;

               zparams.zvars = []; //empty the zvars array
               if(d3.rgb(myColor).toString() === varColor.toString()) {	// we are adding a var

                if(nodes.length==0) {
                    nodes.push(findNode(myText));
                    nodes[0].reflexive=true;
                }

                else {nodes.push(findNode(myText));}

               if(myNode.time==="yes") {
                    tagColors(myNode, timeColor);
                    return hexToRgba(timeColor);
               }
               else if(myNode.nature==="nominal") {
                    tagColors(myNode, nomColor);
                    return hexToRgba(nomColor);
               }
               else {
                    return hexToRgba(selVarColor);
               }

               }
               else { // dropping a variable

                    nodes.splice(findNode(myText)["index"], 1);
                    spliceLinksForNode(findNode(myText));

                if(mySC==dvColor) {
                    var dvIndex = zparams.zdv.indexOf(myText);
                    if (dvIndex > -1) { zparams.zdv.splice(dvIndex, 1); }
                    //zparams.zdv="";
                }
                else if(mySC==csColor) {
                    var csIndex = zparams.zcross.indexOf(myText);
                    if (csIndex > -1) { zparams.zcross.splice(csIndex, 1); }
                }
                else if(mySC==timeColor) {
                	//console.log("entering some if");
                    var timeIndex = zparams.ztime.indexOf(myText);
                    //console.log("Timeindex=",timeIndex);
                    if (timeIndex > -1) { zparams.ztime.splice(timeIndex, 1); }
                }
               else if(mySC==nomColor) {
                    var nomIndex = zparams.znom.indexOf(myText);
                    if (nomIndex > -1) { zparams.znom.splice(dvIndex, 1); }
               }

               // nodeReset(allNodes[findNodeIndex(myText)]);
                borderState();
               legend();
                return varColor;
               }
               });

        panelPlots();
        restart();
        });
	}
		//console.log("Search ID at start: "+srchid);


// returns id
var findNodeIndex = function(nodeName) {
    for (var i in allNodes) {
        if(allNodes[i]["name"] === nodeName) {return allNodes[i]["id"];}

    };
}

var nodeIndex = function(nodeName) {
    for (var i in nodes) {
        if(nodes[i]["name"] === nodeName) {return i;}
    }
}

var findNode = function(nodeName) {
    for (var i in allNodes) {if (allNodes[i]["name"] === nodeName) return allNodes[i]};
}


// function called by force button
function forceSwitch() {
    if(forcetoggle[0]==="true") { forcetoggle = ["false"];}
    else {forcetoggle = ["true"]}

    if(forcetoggle[0]==="false") {
        document.getElementById('btnForce').setAttribute("class", "btn active");
    }
    else {
        document.getElementById('btnForce').setAttribute("class", "btn btn-default");
        fakeClick();
    }
}


function spliceLinksForNode(node) {
    var toSplice = links.filter(function(l) {
                                return (l.source === node || l.target === node);
                                });
    toSplice.map(function(l) {
                 links.splice(links.indexOf(l), 1);
                 });
}

function zPop() {
    if (dataurl) {
	zparams.zdataurl = dataurl;
    }

    zparams.zmodelcount = modelCount;

    zparams.zedges = [];
    zparams.zvars = [];

    for(var j =0; j < nodes.length; j++ ) { //populate zvars array
        zparams.zvars.push(nodes[j].name);
        var temp = nodes[j].id;
        //var temp = findNodeIndex(nodes[j].name);
        //console.log("node ",nodes[j].id);
        //console.log("temp ", temp);

        zparams.zsetx[j] = allNodes[temp].setxvals;
        zparams.zsubset[j] = allNodes[temp].subsetrange;
    }

    for(var j =0; j < links.length; j++ ) { //populate zedges array
        var srctgt = [];
        //correct the source target ordering for Zelig
        if(links[j].left===false) {
            srctgt = [links[j].source.name, links[j].target.name];
        }
        else {
            srctgt = [links[j].target.name, links[j].source.name];
        }
        zparams.zedges.push(srctgt);
    }
}

function estimate(btn) {


    if(production && zparams.zsessionid=="") {
        alert("Warning: Data download is not complete. Try again soon.");
        return;
    }

    zPop();
    // write links to file & run R CMD

    //package the output as JSON
    // add call history and package the zparams object as JSON
    zparams.callHistory = callHistory;
    var jsonout = JSON.stringify(zparams);

    //var base = rappURL+"zeligapp?solaJSON="
    urlcall = rappURL + "zeligapp"; //base.concat(jsonout);
    var solajsonout = "solaJSON=" + jsonout;
    //console.log("urlcall out: ", urlcall);
    //console.log("POST out: ", solajsonout);


    zparams.allVars = valueKey.slice(10,25); // this is because the URL is too long...
    var jsonout = JSON.stringify(zparams);
    //var selectorBase = rappURL+"selectorapp?solaJSON=";
    var selectorurlcall = rappURL+"selectorapp"; //.concat(jsonout);

    function estimateSuccess(btn,json) {
        estimateLadda.stop();  // stop spinner
        allResults.push(json);
        // console.log(allResults);
        //console.log("json in: ", json);

        var myparent = document.getElementById("results");
        if (estimated == false) {
            myparent.removeChild(document.getElementById("resultsHolder"));
        }


        estimated=true;
        d3.select("#results")
        .style("display", "block");

        d3.select("#resultsView")
        .style("display", "block");

        d3.select("#modelView")
            .style("display", "block");


        // programmatic click on Results button
        $("#btnResults").trigger("click");


        modelCount = modelCount+1;
        var model = "Model".concat(modelCount);

        function modCol() {
            d3.select("#modelView")
                .selectAll("p")
                .style('background-color', hexToRgba(varColor));
        }

        modCol();

        d3.select("#modelView")
            .insert("p", ":first-child") // top stack for results
            .attr("id", model)
            .text(model)
            .style('background-color', hexToRgba(selVarColor))
            .on("click", function () {
                var a = this.style.backgroundColor.replace(/\s*/g, "");
                var b = hexToRgba(selVarColor).replace(/\s*/g, "");
                if (a.substr(0, 17) === b.substr(0, 17)) {
                    return; //escapes the function early if the displayed model is clicked
                }
                modCol();
                d3.select(this)
                    .style('background-color', hexToRgba(selVarColor));
                viz(this.id);
            });

        var rCall = [];
        rCall[0] = json.call;
        logArray.push("estimate: ".concat(rCall[0]));
        showLog();

        viz(model);
    }

    function estimateFail(btn) {
        estimateLadda.stop();  // stop spinner
        estimated = true;
    }

    function selectorSuccess(btn, json) {
        d3.select("#ticker")
            .text("Suggested variables and percent improvement on RMSE: " + json.vars);
        // console.log("selectorSuccess: ", json);
    }

    function selectorFail(btn) {
        alert("Selector Fail");
    }

    estimateLadda.start();  // start spinner

    makeCorsRequest(urlcall,btn, estimateSuccess, estimateFail, solajsonout);
    //makeCorsRequest(selectorurlcall, btn, selectorSuccess, selectorFail, solajsonout);


}


function dataDownload() {
    zPop();
    // write links to file & run R CMD

    //package the output as JSON
    // add call history and package the zparams object as JSON
    //console.log("inside datadownload, zparams= ",zparams);
    zparams.zmetadataurl = metadataurl;
    zparams.zusername = username;
    var jsonout = JSON.stringify(zparams);

    var btn="nobutton";

    //var base = rappURL+"zeligapp?solaJSON="
    urlcall = rappURL + "dataapp"; //base.concat(jsonout);
    var solajsonout = "solaJSON=" + jsonout;
    //console.log("urlcall out: ", urlcall);

   // console.log("POST out: ", solajsonout);

    function downloadSuccess(btn, json) {
        //console.log("dataDownload json in: ", json);
        zparams.zsessionid=json.sessionid[0];


        // set the link URL
        if (production) {
            var logURL = rappURL + "log_dir/log_" + zparams.zsessionid + ".txt";
            document.getElementById("logID").href = logURL;
        }
        else {
            var logURL = "rook/log_" + zparams.zsessionid + ".txt";
            document.getElementById("logID").href = logURL;
        }

    }

    function downloadFail(btn) {
        console.log("Data have not been downloaded");

    makeCorsRequest(urlcall,btn, downloadSuccess, downloadFail, solajsonout);
    }
}



function viz(m) {
    var mym = +m.substr(5,5) - 1;

    function removeKids(parent) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }

    var myparent = document.getElementById("resultsView");
    removeKids(myparent);

    var json = allResults[mym];

    // pipe in figures to right panel
    var filelist = new Array;
    for(var i in json.images) {
        var zfig = document.createElement("img");
        zfig.setAttribute("src", json.images[i]);
        zfig.setAttribute('width', 200);
        zfig.setAttribute('height', 200);
        document.getElementById("resultsView").appendChild(zfig);
    }

   // var rCall = [];
   // rCall[0] = json.call;
   // logArray.push("estimate: ".concat(rCall[0]));
   // showLog();


    // write the results table
    var resultsArray = [];
    for (var key in json.sumInfo) {
        if(key=="colnames") {continue;}

        var obj = json.sumInfo[key];
        resultsArray.push(obj);
        /* SO says this is important check, but I don't see how it helps here...
         for (var prop in obj) {
         // important check that this is objects own property
         // not from prototype prop inherited
         if(obj.hasOwnProperty(prop)){
         alert(prop + " = " + obj[prop]);
         }
         }  */
    }

    var table = d3.select("#resultsView")
    .append("p")
//    .html("<center><b>Results</b></center>")
    .append("table");

    var thead = table.append("thead");
    thead.append("tr")
    .selectAll("th")
    .data(json.sumInfo.colnames)
    .enter()
    .append("th")
    .text(function(d) { return d;});

    var tbody = table.append("tbody");
    tbody.selectAll("tr")
    .data(resultsArray)
    .enter().append("tr")
    .selectAll("td")
    .data(function(d){return d;})
    .enter().append("td")
    .text(function(d){
          var myNum = Number(d);
          if(isNaN(myNum)) { return d;}
          return myNum.toPrecision(3);
          })
    .on("mouseover", function(){d3.select(this).style("background-color", "aliceblue")}) // for no discernable reason
    .on("mouseout", function(){d3.select(this).style("background-color", "#F9F9F9")}) ;  //(but maybe we'll think of one)

    d3.select("#resultsView")
    .append("p")
    .html(function() {
          return "<b>Formula: </b>".concat(json.call[0]);
          });
}

// this function parses the transformation input. variable names are often nested inside one another, e.g., ethwar, war, wars, and so this is handled
function transParse(n) {

    var out2 = [];
    var t2=n;
    var k2=0;
    var subMe2 = "_transvar".concat(k2);
    var indexed = [];

    // out2 is all matched variables, indexed is an array, each element is an object that contains the matched variables starting index and finishing index.  e.g., n="wars+2", out2=[war, wars], indexed=[{0,2},{0,3}]
    for(var i in valueKey) {
        var m2 = n.match(valueKey[i]);
        if(m2 !== null) {
            out2.push(m2[0]);
        }

        var re = new RegExp(valueKey[i], "g")
        var s = n.search(re);
        if(s != -1) {
            indexed.push({from:s, to:s+valueKey[i].length});
        }
    }

    // nested loop not good, but indexed is not likely to be very large.
    // if a variable is nested, it is removed from out2
    // notice, loop is backwards so that index changes don't affect the splice
    //console.log("indexed ", indexed);
    for(var i=indexed.length-1; i>-1; i--) {
        for(var j=indexed.length-1; j>-1; j--) {
            if(i===j) {continue;}
            if((indexed[i].from >= indexed[j].from) & (indexed[i].to <= indexed[j].to)) {
                //console.log(i, " is nested in ", j);
                out2.splice(i, 1);
            }
        }
    }

    for(var i in out2) {
        t2 = t2.replace(out2[i], subMe2); //something that'll never be a variable name
        k2 = k2+1;
        subMe2 = "_transvar".concat(k2);
    }

    if(out2.length > 0) {
        out2.push(t2);
        //console.log("new out ", out2);
        return(out2);
    }
    else {
        alert("No variable name found. Perhaps check your spelling?");
        return null;
    }
}

function transform(n,t, typeTransform) {

    if(production && zparams.zsessionid=="") {
        alert("Warning: Data download is not complete. Try again soon.");
        return;
    }

    if(!typeTransform){
        t = t.replace("+", "_plus_"); // can't send the plus operator
    }

    //console.log(n);
    //console.log(t);

    var btn = document.getElementById('btnEstimate');


    var myn = allNodes[findNodeIndex(n[0])];
    if(typeof myn==="undefined") {var myn = allNodes[findNodeIndex(n)];}

    var outtypes = {varnamesTypes:n, interval:myn.interval, numchar:myn.numchar, nature:myn.nature, binary:myn.binary, time:myn.time};

    //console.log(myn);
    // if typeTransform but we already have the metadata
    if(typeTransform) {
        if(myn.nature=="nominal" & typeof myn.plotvalues !=="undefined") {
            myn.plottype="bar";
            barsNode(myn);
            populatePopover();
            panelPlots();
            return;
        }
        else if (myn.nature!="nominal" & typeof myn.plotx !=="undefined") {
            myn.plottype="continuous";
            densityNode(myn);
            populatePopover();
            panelPlots();
            return;
        }
    }


    //package the output as JSON
    var transformstuff = {
        zdataurl: dataurl,
        zvars: n,
        zsessionid: zparams.zsessionid,
        transform: t,
        callHistory: callHistory,
        typeTransform: typeTransform,
        typeStuff: outtypes
    };
    var jsonout = JSON.stringify(transformstuff);
    //var base = rappURL+"transformapp?solaJSON="


    urlcall = rappURL+"transformapp"; //base.concat(jsonout);
    var solajsonout = "solaJSON="+jsonout;
    //console.log("urlcall out: ", urlcall);
    //console.log("POST out: ", solajsonout);



    function transformSuccess(btn, json) {
        estimateLadda.stop();
        //console.log("json in: ", json);


        if(json.typeTransform[0]) {

            d3.json(json.url, function(error, json) {
                        if (error) return console.warn(error);
                        var jsondata = json;
                    	var vars=jsondata["variables"];

                        for(var key in vars) {
                            var myIndex = findNodeIndex(key);
                            jQuery.extend(true, allNodes[myIndex], jsondata.variables[key]);

                            if(allNodes[myIndex].plottype === "continuous") {
                                densityNode(allNodes[myIndex]);
                            }
                            else if (allNodes[myIndex].plottype === "bar") {
                                barsNode(allNodes[myIndex]);
                            }
                        }

                        fakeClick();
                        populatePopover();
                        panelPlots();
                    //console.log(allNodes[myIndex]);
                    });
        }
        else {

            callHistory.push({func:"transform", zvars:n, transform:t});


            var subseted = false;
            var rCall = [];
            rCall[0] = json.call;
            var newVar = rCall[0][0];
            trans.push(newVar);


            d3.json(json.url, function(error, json) {
                    if (error) return console.warn(error);
                    var jsondata = json;
                    //var jsondata = json;
                    var vars=jsondata["variables"];
                    for(var key in vars) {
                        var myIndex = findNodeIndex(key);
                    if(typeof myIndex !== "undefined") {

                        alert("Invalid transformation: this variable name already exists.");
                        return;
                    }
                    // add transformed variable to the current space
                    var i = allNodes.length;
                    var obj1 = {id:i, reflexive: false, "name": key, "labl": "transformlabel", data: [5,15,20,0,5,15,20], count: [.6, .2, .9, .8, .1, .3, .4], "nodeCol":colors(i), "baseCol":colors(i), "strokeColor":selVarColor, "strokeWidth":"1", "subsetplot":false, "subsetrange":["", ""],"setxplot":false, "setxvals":["", ""], "grayout":false, "defaultInterval":jsondata.variables[key]["interval"], "defaultNumchar":jsondata.variables[key]["numchar"], "defaultNature":jsondata.variables[key]["nature"], "defaultBinary":jsondata.variables[key]["binary"]};

                    jQuery.extend(true, obj1, jsondata.variables[key]);
                    allNodes.push(obj1);

                    scaffoldingPush(rCall[0]);
                    valueKey.push(newVar);
                    nodes.push(allNodes[i]);
                    fakeClick();
                    panelPlots();

                    if(allNodes[i].plottype === "continuous") {
                        densityNode(allNodes[i]);
                    }
                    else if (allNodes[i].plottype === "bar") {
                        barsNode(allNodes[i]);

                        }
                    }//for


                    });


            // update the log
            logArray.push("transform: ".concat(rCall[0]));
            showLog();

            /*
             // NOTE: below is the carousel portion that needs to be revised as of May 29 2015

             // add transformed variable to all spaces
             // check if myspace callHistory contains a subset
             for(var k0=0; k0<callHistory.length; k0++) {
             if(callHistory[k0].func==="subset") {
             var subseted = true;
             }
             }

             loopJ:
             for(var j in spaces) {
             if(j===myspace) {continue;}
             var i = spaces[j].allNodes.length;
             if(subseted===true) { // myspace has been subseted
             offspaceTransform(j);
             continue loopJ;
             }
             loopK:
             for(var k=0; k<spaces[j].callHistory.length; k++) { // gets here if myspace has not been subseted
             if(spaces[j].callHistory[k].func==="subset") { // check if space j has been subseted
             offspaceTransform(j);
             continue loopJ;
             }
             }
             // if there is a subset in the callHistory of the current space, transformation is different
             function offspaceTransform(j) {
             transformstuff = {zdataurl:dataurl, zvars:n, zsessionid:zparams.zsessionid, transform:t, callHistory:spaces[j].callHistory};
             var jsonout = JSON.stringify(transformstuff);
             //var base = rappURL+"transformapp?solaJSON="
             urlcall = rappURL+"transformapp"; //base.concat(jsonout);
             var solajsonout = "solaJSON="+jsonout;
             console.log("urlcall out: ", urlcall);
             console.log("POST out: ", solajsonout);


             function offspaceSuccess(btn, json) {
             spaces[j].callHistory.push({func:"transform", zvars:n, transform:t});
             spaces[j].logArray.push("transform: ".concat(rCall[0]));
             readPreprocess(json.url, p=spaces[j].preprocess, v=newVar, callback=null);

             spaces[j].allNodes.push({id:i, reflexive: false, "name": rCall[0][0], "labl": "transformlabel", data: [5,15,20,0,5,15,20], count: hold, "nodeCol":colors(i), "baseCol":colors(i), "strokeColor":selVarColor, "strokeWidth":"1", "interval":json.types.interval[0], "numchar":json.types.numchar[0], "nature":json.types.nature[0], "binary":json.types.binary[0], "defaultInterval":json.types.interval[0], "defaultNumchar":json.types.numchar[0], "defaultNature":json.types.nature[0], "defaultBinary":json.types.binary[0], "min":json.sumStats.min[0], "median":json.sumStats.median[0], "sd":json.sumStats.sd[0], "mode":(json.sumStats.mode[0]).toString(), "freqmode":json.sumStats.freqmode[0],"fewest":(json.sumStats.fewest[0]).toString(), "freqfewest":json.sumStats.freqfewest[0], "mid":(json.sumStats.mid[0]).toString(), "freqmid":json.sumStats.freqmid[0], "uniques":json.sumStats.uniques[0], "herfindahl":json.sumStats.herfindahl[0],
             "valid":json.sumStats.valid[0], "mean":json.sumStats.mean[0], "max":json.sumStats.max[0], "invalid":json.sumStats.invalid[0], "subsetplot":false, "subsetrange":["", ""],"setxplot":false, "setxvals":["", ""], "grayout":false});
             }
             function offspaceFail(btn) {
             alert("transform fail");
             }
             makeCorsRequest(urlcall,btn, offspaceSuccess, offspaceFail, solajsonout);
             }

             // if myspace and space j have not been subseted, append the same transformation
             spaces[j].callHistory.push({func:"transform", zvars:n, transform:t});
             spaces[j].logArray.push("transform: ".concat(rCall[0]));

             spaces[j].allNodes.push({id:i, reflexive: false, "name": rCall[0][0], "labl": "transformlabel", data: [5,15,20,0,5,15,20], count: hold, "nodeCol":colors(i), "baseCol":colors(i), "strokeColor":selVarColor, "strokeWidth":"1", "interval":json.types.interval[0], "numchar":json.types.numchar[0], "nature":json.types.nature[0], "binary":json.types.binary[0], "defaultInterval":json.types.interval[0], "defaultNumchar":json.types.numchar[0], "defaultNature":json.types.nature[0], "defaultBinary":json.types.binary[0], "min":json.sumStats.min[0], "median":json.sumStats.median[0], "sd":json.sumStats.sd[0], "mode":(json.sumStats.mode[0]).toString(), "freqmode":json.sumStats.freqmode[0],"fewest":(json.sumStats.fewest[0]).toString(), "freqfewest":json.sumStats.freqfewest[0], "mid":(json.sumStats.mid[0]).toString(), "freqmid":json.sumStats.freqmid[0], "uniques":json.sumStats.uniques[0], "herfindahl":json.sumStats.herfindahl[0],
             "valid":json.sumStats.valid[0], "mean":json.sumStats.mean[0], "max":json.sumStats.max[0], "invalid":json.sumStats.invalid[0], "subsetplot":false, "subsetrange":["", ""],"setxplot":false, "setxvals":["", ""], "grayout":false});

             readPreprocess(json.url, p=spaces[j].preprocess, v=newVar, callback=null);
             }   */
        }
    }

    function transformFail(btn) {
        alert("transform fail");
        estimateLadda.stop();
    }

    estimateLadda.start();  // start spinner

    makeCorsRequest(urlcall,btn, transformSuccess, transformFail, solajsonout);

}

function scaffoldingPush(v) { // adding a variable to the variable list after a transformation

        d3.select("#variableList")
        .data(v)
        .append("p")
        .attr("id",function(){
              return v[0].replace(/\W/g, "_");
              })
        .text(v[0])
        .style('background-color', hexToRgba(selVarColor))
        .attr("data-container", "main")
        .attr("data-toggle", "popover")
        .attr("data-trigger", "hover")
        .attr("data-placement", "right")
        .attr("data-html", "true")
        .attr("onmouseover", "$(this).popover('toggle');")
        .attr("onmouseout", "$(this).popover('toggle');")
        .attr("data-original-title", "Summary Statistics")
        .on("click", function varClick(){ // we've added a new variable, so we need to add the listener
            d3.select(this)
            .style('background-color',function(d) {
                   var myText = d3.select(this).text();
                   var myColor = d3.select(this).style('background-color');
                   var mySC = allNodes[findNodeIndex(myText)].strokeColor;

                   zparams.zvars = []; //empty the zvars array
                   if(d3.rgb(myColor).toString() === varColor.toString()) { // we are adding a var
                    if(nodes.length==0) {
                        nodes.push(findNode(myText));
                        nodes[0].reflexive=true;
                    }
                    else {nodes.push(findNode(myText));}
                    return hexToRgba(selVarColor);
                   }
                   else { // dropping a variable

                    nodes.splice(findNode(myText)["index"], 1);
                    spliceLinksForNode(findNode(myText));

                    if(mySC==dvColor) {
                        var dvIndex = zparams.zdv.indexOf(myText);
                        if (dvIndex > -1) { zparams.zdv.splice(dvIndex, 1); }
                    }
                    else if(mySC==csColor) {
                        var csIndex = zparams.zcross.indexOf(myText);
                        if (csIndex > -1) { zparams.zcross.splice(csIndex, 1); }
                    }
                    else if(mySC==timeColor) {
                        var timeIndex = zparams.ztime.indexOf(myText);
                        if (timeIndex > -1) { zparams.ztime.splice(dvIndex, 1); }
                    }
                    else if(mySC==nomColor) {
                        var nomIndex = zparams.znom.indexOf(myText);
                        if (nomIndex > -1) { zparams.znom.splice(dvIndex, 1); }
                    }

                    nodeReset(allNodes[findNodeIndex(myText)]);
                    borderState();
                    return varColor;
                   }
                });
            fakeClick();
            panelPlots();
            });
        populatePopover(); // pipes in the summary stats

        // drop down menu for tranformation toolbar
        d3.select("#transSel")
        .data(v)
        .append("option")
        .text(function(d) {return d; });
}

// below from http://www.html5rocks.com/en/tutorials/cors/ for cross-origin resource sharing
// Create the XHR object.
function createCORSRequest(method, url, callback) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
        // XHR for Chrome/Firefox/Opera/Safari.
        xhr.open(method, url, true);
    } else if (typeof XDomainRequest != "undefined") {
        // XDomainRequest for IE.
        xhr = new XDomainRequest();
        xhr.open(method, url);
    } else {
        // CORS not supported.
        xhr = null;
    }
  // xhr.setRequestHeader('Content-Type', 'text/json');
//xhr.setRequestHeader('Content-Type', 'multipart/form-data');


    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    return xhr;

}


// Make the actual CORS request.
function makeCorsRequest(url,btn,callback, warningcallback, jsonstring) {
    var xhr = createCORSRequest('POST', url);
	//console.log("inside cors json size:"+jsonstring.length);
    if (!xhr) {
        alert('CORS not supported');
        return;
    }
    // Response handlers for asynchronous load
    // onload or onreadystatechange?

    xhr.onload = function() {

      var text = xhr.responseText;
      //console.log("text ", text);

        try {
            var json = JSON.parse(text);   // should wrap in try / catch
            var names = Object.keys(json);
        }
        catch(err) {
            estimateLadda.stop();
            selectLadda.stop();
            //console.log(err);
            alert('Error: Could not parse incoming JSON.');
        }

      if (names[0] == "warning"){
        warningcallback(btn);
        alert("Warning: " + json.warning);
      }else{
        callback(btn, json);
      }
    };
    xhr.onerror = function() {
        // note: xhr.readystate should be 4, and status should be 200.  a status of 0 occurs when the url becomes too large
        if(xhr.status==0) {
            alert('There was an error making the request. xmlhttprequest status is 0.');
        }
        else if(xhr.readyState!=4) {
            alert('There was an error making the request. xmlhttprequest readystate is not 4.');
        }
        else {
            alert('Woops, there was an error making the request.');
        }
        //console.log(xhr);
        estimateLadda.stop();
        selectLadda.stop();
    };
    xhr.send(jsonstring);
}


function legend(c) { // this could be made smarter
    if (zparams.ztime.length!=0 | zparams.zcross.length!=0 | zparams.zdv.length!=0 | zparams.znom.length!=0) {
        document.getElementById("legend").setAttribute("style", "display:block");
    }
    else {
        document.getElementById("legend").setAttribute("style", "display:none");
    }


    if(zparams.ztime.length==0) {
        document.getElementById("timeButton").setAttribute("class", "clearfix hide");
    }
    else {
        document.getElementById("timeButton").setAttribute("class", "clearfix show");
    }
    if(zparams.zcross.length==0) {
        document.getElementById("csButton").setAttribute("class", "clearfix hide");
    }
    else {
        document.getElementById("csButton").setAttribute("class", "clearfix show");
    }
    if(zparams.zdv.length==0) {
        document.getElementById("dvButton").setAttribute("class", "clearfix hide");
    }
    else {
        document.getElementById("dvButton").setAttribute("class", "clearfix show");
    }
    if(zparams.znom.length==0) {
        document.getElementById("nomButton").setAttribute("class", "clearfix hide");
    }
    else {
        document.getElementById("nomButton").setAttribute("class", "clearfix show");
    }

    borderState();
}


function reset() {
    location.reload();
}

// programmatically deselecting every selected variable...
function erase() {
    leftpanelMedium();
    rightpanelMedium();
    document.getElementById("legend").setAttribute("style", "display:none");

    tabLeft('variableList');

    jQuery.fn.d3Click = function () {
        this.children().each(function (i, e) {
                    var mycol = d3.rgb(this.style.backgroundColor);
                    if(mycol.toString()===varColor.toString()) {return;}
                  var evt = document.createEvent("MouseEvents");
                  evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

                  e.dispatchEvent(evt);
                  });
    };
    $("#variableList").d3Click();
}


function deselect(d) {
    //console.log(d);
}

// http://www.tutorials2learn.com/tutorials/scripts/javascript/xml-parser-javascript.html
function loadXMLDoc(XMLname)
{
    var xmlDoc;
    if (window.XMLHttpRequest)
    {
        xmlDoc=new window.XMLHttpRequest();
        xmlDoc.open("GET",XMLname,false);
        xmlDoc.send("");
        return xmlDoc.responseXML;
    }
    // IE 5 and IE 6
    else if (ActiveXObject("Microsoft.XMLDOM"))
    {
        xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async=false;
        xmlDoc.load(XMLname);
        return xmlDoc;
    }
    alert("Error loading document!");
    return null;
}


function tabLeft(tab) {

    //if(tab!="tab3") {lefttab=tab;}
    // var tabi = tab.substring(3);

    document.getElementById('tab1').style.display = 'none';
    document.getElementById('tab2').style.display = 'none';

    switch(tab){
      case "tab1": summaryHold = false;
        $(".btn-group").children().addClass("btn btn-default").removeClass("active");
        // document.getElementById('btnSubset').setAttribute("class", "btn btn-default");
        document.getElementById('btnVariables').setAttribute("class", "btn active");
        document.getElementById("btnSelect").style.display = 'none';

        d3.select("#leftpanel")
        .attr("class", "sidepanel container clearfix");
                  break;//end of case 1
      case "tab2": summaryHold = false;
      $(".btn-group").children().addClass("btn").addClass("btn-default").removeClass("active");
        document.getElementById('btnSubset').setAttribute("class", "btn active");

        d3.select("#leftpanel")
        .attr("class", function(d){
              //if(this.getAttribute("class")==="sidepanel container clearfix expandpanel") {
                document.getElementById("btnSelect").style.display = 'none';
                return "sidepanel container clearfix";
              // }
              // else {
              //   document.getElementById("btnSelect").style.display = 'block';
              //   return "sidepanel container clearfix expandpanel";
              // }
              });
                  break;//end of case 2
      case "tab3":summaryHold = false;
      $(".btn-group").children().addClass("btn btn-default").removeClass("active");
        // document.getElementById('btnVariables').setAttribute("class", "btn btn-default");
        document.getElementById('btnLocation').setAttribute("class", "btn active");

        d3.select("#leftpanel")
        .attr("class", function(d){
             // if(this.getAttribute("class")==="sidepanel container clearfix expandpanel") {
                document.getElementById("btnSelect").style.display = 'none';
                return "sidepanel container clearfix";
              // }
              // else {
              //   document.getElementById("btnSelect").style.display = 'block';
              //   return "sidepanel container clearfix expandpanel";
              // }
              });
                  break;//end of case 3
      case "tab4":summaryHold = false;
      $(".btn-group").children().addClass("btn btn-default").removeClass("active");
        // document.getElementById('btnVariables').setAttribute("class", "btn btn-default");
        document.getElementById('btnDate').setAttribute("class", "btn active");

        d3.select("#leftpanel")
        .attr("class", function(d){
              if(this.getAttribute("class")==="sidepanel container clearfix expandpanel") {
                document.getElementById("btnSelect").style.display = 'none';
                return "sidepanel container clearfix";
              }
              else {
                document.getElementById("btnSelect").style.display = 'none';
                return "sidepanel container clearfix expandpanel";
              }
              });
                  break;//end of case 4
      case "tab5":summaryHold = false;
        $(".btn-group").children().addClass("btn btn-default").removeClass("active");
        //document.getElementById('btnVariables').setAttribute("class", "btn btn-default");
        document.getElementById('btnEvent').setAttribute("class", "btn active");

        d3.select("#leftpanel")
        .attr("class", function(d){
              //if(this.getAttribute("class")==="sidepanel container clearfix expandpanel") {
                document.getElementById("btnSelect").style.display = 'none';
                return "sidepanel container clearfix";
              // }
              // else {
              //   document.getElementById("btnSelect").style.display = 'none';
              //   return "sidepanel container clearfix expandpanel";
              // }
              });
                  break;//end of case 5
      default:
        $(".btn-group").children().addClass("btn btn-default").removeClass("active");
        // document.getElementById('btnSubset').setAttribute("class", "btn btn-default");
        // document.getElementById('btnVariables').setAttribute("class", "btn btn-default");

        d3.select("#leftpanel")
        .attr("class", "sidepanel container clearfix");
        break;

    }//end of switch

    document.getElementById(tab).style.display = 'block';
}

//final query json string
var qr={};
    qr["type"]="postquery";
    qr["query"]={"date8":{},"country_code":{},"source":{},"target":{},"root_code":{}};


function tabRight(tabid) {

    document.getElementById('models').style.display = 'none';
    document.getElementById('setx').style.display = 'none';
    document.getElementById('results').style.display = 'none';

    if(tabid=="btnModels") {
      document.getElementById('btnSetx').setAttribute("class", "btn btn-default");
      document.getElementById('btnResults').setAttribute("class", "btn btn-default");
      document.getElementById('btnModels').setAttribute("class", "btn active");
      document.getElementById('models').style.display = 'block';

        d3.select("#rightpanel")
        .attr("class", "sidepanel container clearfix");
    }
    else if (tabid=="btnSetx") {
      document.getElementById('btnModels').setAttribute("class", "btn btn-default");
      document.getElementById('btnResults').setAttribute("class", "btn btn-default");
      document.getElementById('btnSetx').setAttribute("class", "btn active");
      document.getElementById('setx').style.display = 'block';

        if(righttab=="btnSetx"  | d3.select("#rightpanel").attr("class")=="sidepanel container clearfix") {toggleR()};
    }
    else if (tabid=="btnResults") {
      document.getElementById('btnModels').setAttribute("class", "btn btn-default");
      document.getElementById('btnSetx').setAttribute("class", "btn btn-default");
      document.getElementById('btnResults').setAttribute("class", "btn active");
      document.getElementById('results').style.display = 'block';

        if(estimated===false) {
            d3.select("#rightpanel")
            .attr("class", "sidepanel container clearfix");
        }
        else if(righttab=="btnResults" | d3.select("#rightpanel").attr("class")=="sidepanel container clearfix") {toggleR()};
    }



    righttab=tabid; // a global that may be of use

    function toggleR() {
        d3.select("#rightpanel")
        .attr("class", function(d){
              if(this.getAttribute("class")==="sidepanel container clearfix expandpanel") {
              return "sidepanel container clearfix";
              }
              else {
              return "sidepanel container clearfix expandpanel";
              }
              });
    }
}


function varSummary(d) {

    var rint = d3.format("r");

        var summarydata = [],
        tmpDataset = [], t1 = ["Mean:","Median:","Most Freq:","Occurrences:", "Median Freq:", "Occurrences:", "Least Freq:", "Occurrences:",  "Stand.Dev:","Minimum:","Maximum:","Invalid:","Valid:","Uniques:","Herfindahl:"],
        t2 = [(+d.mean).toPrecision(4).toString() ,(+d.median).toPrecision(4).toString(),d.mode,rint(d.freqmode),d.mid, rint(d.freqmid), d.fewest, rint(d.freqfewest),(+d.sd).toPrecision(4).toString(),(+d.min).toPrecision(4).toString(),(+d.max).toPrecision(4).toString(),rint(d.invalid),rint(d.valid),rint(d.uniques),(+d.herfindahl).toPrecision(4).toString()],
        i, j;
        if (private) {
          if (d.meanCI) {
            t1 = ["Mean:", "Median:","Most Freq:","Occurrences:", "Median Freq:", "Occurrences:", "Least Freq:", "Occurrences:",  "Stand.Dev:","Minimum:","Maximum:","Invalid:","Valid:","Uniques:","Herfindahl:"],
          t2 = [(+d.mean).toPrecision(2).toString() + " (" + (+d.meanCI.lowerBound).toPrecision(2).toString() + " - " + (+d.meanCI.upperBound).toPrecision(2).toString() + ")" ,(+d.median).toPrecision(4).toString(),d.mode,rint(d.freqmode),d.mid, rint(d.freqmid), d.fewest, rint(d.freqfewest),(+d.sd).toPrecision(4).toString(),(+d.min).toPrecision(4).toString(),(+d.max).toPrecision(4).toString(),rint(d.invalid),rint(d.valid),rint(d.uniques),(+d.herfindahl).toPrecision(4).toString()],
        i, j;
      }
        }

        for (i = 0; i < t1.length; i++) {
            if(t2[i].indexOf("NaN") > -1 | t2[i]=="NA" | t2[i]=="") continue;
            tmpDataset=[];
            tmpDataset.push(t1[i]);
            tmpDataset.push(t2[i]);
            summarydata.push(tmpDataset);
        };

  //  //console.log(summarydata);
//     d3.select("#tab3") //tab when you mouseover a pebble
//     .select("p")
//     .html("<center><b>" +d.name+ "</b><br><i>" +d.labl+ "</i></center>")
//     .append("table")
//     .selectAll("tr")
//     .data(summarydata)
//     .enter().append("tr")
//     .selectAll("td")
//     .data(function(d){return d;})
//     .enter().append("td")
//     .text(function(d){return d;})
//     .on("mouseover", function(){d3.select(this).style("background-color", "aliceblue")}) // for no discernable reason
//     .on("mouseout", function(){d3.select(this).style("background-color", "#F9F9F9")}) ;  //(but maybe we'll think of one)
// //    .style("font-size", "12px");
//
//
//     var plotsvg = d3.select("#tab3")
//     .selectAll("svg")
//     .remove();
//
//     if(typeof d.plottype === "undefined") { // .properties is undefined for some vars
//         return;
//     }
//     else if (d.plottype === "continuous") {
//         density(d, div="varSummary", private);
//     }
//     else if (d.plottype === "bar") {
//         bars(d, div="varSummary", private);
//     }
//     else {
//         var plotsvg = d3.select("#tab3")      // no graph to draw, but still need to remove previous graph
//         .selectAll("svg")
//         .remove();
//     };

}

function populatePopover () {
    d3.select("#variableList").selectAll("p")
    .attr("data-content", function(d) {
          var onNode = findNodeIndex(d);
          return popoverContent(allNodes[onNode]);
          });
}

function popoverRow(label, content){
    var row = "<tr>";
    row += "<td><div class='form-group'><label class='col-sm-6 control-label'>" + label + "</label>";
    row += "<div class='col-sm-6'><p class='form-control-static'>" + content + "</p></div></div></td>";
    row += "</tr>";
    return row
}

function popoverContent(d) {

    var rint = d3.format("r");

    var outtext = "<div style='margin:0;'><table class='table table-condensed' style='width:275px;margin:0;table-layout: auto;'><tbody>";

    if(d.labl != "") { outtext += popoverRow('Label', d.labl) }
    if (d.mean != "NA") {
        if (private && d.meanCI){
            outtext += popoverRow('Mean', (+d.mean).toPrecision(2).toString()  + " (" + (+d.meanCI.lowerBound).toPrecision(2).toString() + " - " + (+d.meanCI.upperBound).toPrecision(2).toString() + ")");
        } else {
            outtext += popoverRow('Mean', (+d.mean).toPrecision(4).toString());
        }
    }
    if (d.median != "NA") {outtext += popoverRow('Median', (+d.median).toPrecision(4).toString()) }
    if (d.mode != "NA") {outtext += popoverRow('Most Freq', d.mode) }
    if (d.freqmode != "NA") { outtext += popoverRow('Occurrences', rint(d.freqmode)) }
    if (d.mid != "NA") { outtext += popoverRow('Median Freq', d.mid) }
    if (d.freqmid != "NA") { outtext += popoverRow('Occ. Mid', rint(d.freqmid)) }
    if (d.fewest != "NA") { outtext += popoverRow('Least Freq', d.fewest) }
    if (d.freqfewest != "NA") { outtext += popoverRow('Occ. Fewest', rint(d.freqfewest)) }
    if (d.sd != "NA") { outtext += popoverRow('Stand Dev', (+d.sd).toPrecision(4).toString()) }
    if (d.max != "NA") { outtext += popoverRow('Maximum', (+d.max).toPrecision(4).toString()) }
    if (d.min != "NA") { outtext += popoverRow('Minimum', (+d.min).toPrecision(4).toString())}
    if (d.invalid != "NA") { outtext += popoverRow('Invalid', rint(d.invalid)) }
    if (d.valid != "NA") { outtext  += popoverRow('Valid', rint(d.valid)) }
    if (d.uniques != "NA") { outtext += popoverRow('Uniques', rint(d.uniques)) }
    if (d.herfindahl != "NA") { outtext += popoverRow('Herfindahl', (+d.herfindahl).toPrecision(4).toString()) }
    return outtext + "</tbody></table></div>";
}

function popupX(d) {

    var tsf = d3.format(".4r");
    var rint = d3.format("r");

    //Create the tooltip label
    d3.select("#tooltip")
    .style("left", tempX + "px")
    .style("top", tempY + "px")
    .select("#tooltiptext")
    .html("<div class='form-group'><label class='col-sm-4 control-label'>Mean</label><div class='col-sm-6'><p class='form-control-static'>" + tsf(d.mean) + "</p></div></div>" +

          "<div class='form-group'><label class='col-sm-4 control-label'>Median</label><div class='col-sm-6'><p class='form-control-static'>" + tsf(d.median) + "</p></div></div>" +

          "<div class='form-group'><label class='col-sm-4 control-label'>Mode</label><div class='col-sm-6'><p class='form-control-static'>" + d.mode + "</p></div></div>" +

          "<div class='form-group'><label class='col-sm-4 control-label'>Stand Dev</label><div class='col-sm-6'><p class='form-control-static'>" + tsf(d.sd) + "</p></div></div>" +

          "<div class='form-group'><label class='col-sm-4 control-label'>Maximum</label><div class='col-sm-6'><p class='form-control-static'>" + tsf(d.max) + "</p></div></div>" +

          "<div class='form-group'><label class='col-sm-4 control-label'>Minimum</label><div class='col-sm-6'><p class='form-control-static'>" + tsf(d.min) + "</p></div></div>" +

          "<div class='form-group'><label class='col-sm-4 control-label'>Valid</label><div class='col-sm-6'><p class='form-control-static'>" + rint(d.valid) + "</p></div></div>" +

          "<div class='form-group'><label class='col-sm-4 control-label'>Invalid</label><div class='col-sm-6'><p class='form-control-static'>" + rint(d.invalid) + "</p></div></div>"
          );

    /*.html("Median: " + d.median + "<br>Mode: " + d.mode + "<br>Maximum: " + d.max + "<br>Minimum: " + d.min + "<br>Mean: " + d.mean + "<br>Invalid: " + d.invalid + "<br>Valid: " + d.valid + "<br>Stand Dev: " + d.sd);*/

    //d3.select("#tooltip")
    //.style("display", "inline")
    //.select("#tooltip h3.popover-title")
    //.html("Summary Statistics");

}


function panelPlots() {

    // build arrays from nodes in main
    var varArray = [];
    var idArray = [];

    for(var j=0; j < nodes.length; j++ ) {
        varArray.push(nodes[j].name.replace(/\(|\)/g, ""));
        idArray.push(nodes[j].id);
    }

    //remove all plots, could be smarter here
    d3.select("#setx").selectAll("svg").remove();
    d3.select("#tab2").selectAll("svg").remove();

    for (var i = 0; i < varArray.length; i++) {
        allNodes[idArray[i]].setxplot=false;
        allNodes[idArray[i]].subsetplot=false;
            if (allNodes[idArray[i]].plottype === "continuous" & allNodes[idArray[i]].setxplot==false) {
                allNodes[idArray[i]].setxplot=true;
                //console.log(private);
                density(allNodes[idArray[i]], div="setx", private);
                allNodes[idArray[i]].subsetplot=true;
                density(allNodes[idArray[i]], div="subset", private);
            }
            else if (allNodes[idArray[i]].plottype === "bar" & allNodes[idArray[i]].setxplot==false) {
                allNodes[idArray[i]].setxplot=true;
                bars(allNodes[idArray[i]], div="setx", private);
                allNodes[idArray[i]].subsetplot=true;
                barsSubset(allNodes[idArray[i]]);
            }
        }


    d3.select("#setx").selectAll("svg")
    .each(function(){
          d3.select(this);
          var regstr = /(.+)_setx_(\d+)/;
          var myname = regstr.exec(this.id);
          var nodeid = myname[2];
          myname = myname[1];
          var j = varArray.indexOf(myname);

        if(j == -1) {
          allNodes[nodeid].setxplot=false;
           var temp = "#".concat(myname,"_setx_",nodeid);
           d3.select(temp)
           .remove();

           allNodes[nodeid].subsetplot=false;
           var temp = "#".concat(myname,"_tab2_",nodeid);
           d3.select(temp)
           .remove();
        }
          });
}

// easy functions to collapse panels to base
function rightpanelMedium() {
    d3.select("#rightpanel")
    .attr("class", "sidepanel container clearfix");
}
function leftpanelMedium() {
    d3.select("#leftpanel")
    .attr("class", "sidepanel container clearfix");
}

// function to convert color codes
function hexToRgb(hex) {
    var h=hex.replace('#', '');

    var bigint = parseInt(h, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    return "rgb(" + r + ", " + g + ", " + b + ")";
}


function hexToRgba(hex) {
    var h=hex.replace('#', '');

    var bigint = parseInt(h, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    var a = '0.5';


    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}

// function takes a node and a color and updates zparams
function setColors (n, c) {
    //console.log("inside setColor: n=",n);
   //if(c==timeColor){

    if(n.strokeWidth=='1') { // adding time, cs, dv, nom to a node with no stroke
    	//console.log("inside strokewidth if");
        n.strokeWidth = '4';
        n.strokeColor = c;
        n.nodeCol = taggedColor;
        if(dvColor==c) {
            // check if array, if not, make it an array
          //  console.log(Object.prototype.toString.call(zparams.zdv));
            zparams.zdv = Object.prototype.toString.call(zparams.zdv) == "[object Array]" ? zparams.zdv : [];
            zparams.zdv.push(n.name);
        }
        else if(csColor==c) {
            zparams.zcross = Object.prototype.toString.call(zparams.zcross) == "[object Array]" ? zparams.zcross : [];
            zparams.zcross.push(n.name);
        }
        else if(timeColor==c) {

            zparams.ztime = Object.prototype.toString.call(zparams.ztime) == "[object Array]" ? zparams.ztime : [];
            zparams.ztime.push(n.name);
        }
        else if(nomColor==c) {
            zparams.znom = Object.prototype.toString.call(zparams.znom) == "[object Array]" ? zparams.znom : [];
            zparams.znom.push(n.name);
            allNodes[findNodeIndex(n.name)].nature="nominal";
            transform(n.name, t=null, typeTransform=true);
        }

        d3.select("#variableList").select("p#".concat(n.name))
        .style('background-color', hexToRgba(c));
    }
    else if (n.strokeWidth=='4') {
        if(c==n.strokeColor) { // deselecting time, cs, dv, nom
            n.strokeWidth = '1';
            n.strokeColor = selVarColor;
            n.nodeCol=colors(n.id);
            d3.select("#variableList").select("p#".concat(n.name))
            .style('background-color', hexToRgba(selVarColor));

            if(dvColor==c) {
                var dvIndex = zparams.zdv.indexOf(n.name);
                if (dvIndex > -1) { zparams.zdv.splice(dvIndex, 1); }
            }
            else if(csColor==c) {
                var csIndex = zparams.zcross.indexOf(n.name);
                if (csIndex > -1) { zparams.zcross.splice(csIndex, 1); }
            }
            else if(timeColor==c) {
                var timeIndex = zparams.ztime.indexOf(n.name);
                if (timeIndex > -1) { zparams.ztime.splice(timeIndex, 1); }
            }
            else if(nomColor==c) {
                var nomIndex = zparams.znom.indexOf(n.name);
                if (nomIndex > -1) { zparams.znom.splice(nomIndex, 1);
                    allNodes[findNodeIndex(n.name)].nature=allNodes[findNodeIndex(n.name)].defaultNature;
                    transform(n.name, t=null, typeTransform=true);
                }
            }
        }
        else { // deselecting time, cs, dv, nom AND changing it to time, cs, dv, nom
            if(dvColor==n.strokeColor) {
                var dvIndex = zparams.zdv.indexOf(n.name);
                if (dvIndex > -1) { zparams.zdv.splice(dvIndex, 1); }
            }
            else if(csColor==n.strokeColor) {
                var csIndex = zparams.zcross.indexOf(n.name);
                if (csIndex > -1) { zparams.zcross.splice(csIndex, 1); }
            }
            else if(timeColor==n.strokeColor) {
                var timeIndex = zparams.ztime.indexOf(n.name);
                if (timeIndex > -1) { zparams.ztime.splice(timeIndex, 1); }
            }
            else if(nomColor==n.strokeColor) {
                var nomIndex = zparams.znom.indexOf(n.name);
                if (nomIndex > -1) {
                    zparams.znom.splice(nomIndex, 1);
                    allNodes[findNodeIndex(n.name)].nature=allNodes[findNodeIndex(n.name)].defaultNature;
                    transform(n.name, t=null, typeTransform=true);
                }
            }
            n.strokeColor = c;
            d3.select("#variableList").select("p#".concat(n.name))
            .style('background-color', hexToRgba(c));

            if(dvColor==c) {zparams.zdv.push(n.name);}
            else if(csColor==c) {zparams.zcross.push(n.name);}
            else if(timeColor==c) {zparams.ztime.push(n.name);}
            else if(nomColor==c) {
                zparams.znom.push(n.name);
                allNodes[findNodeIndex(n.name)].nature="nominal";
                transform(n.name, t=null, typeTransform=true);
            }
        }
    }
}

//function tagColors is called when a variable is added to the modeling space AND that variable contains a 'tag-able' property that will change the appears of the pebble--examples include 'time', 'nominal', and 'dv'. Set c to false if passing more than one node in n, as would be done  through scaffolding when initially called.
function tagColors (n, c) {

    function baseSet(n, c) {
        n.strokeWidth = '4';
        n.strokeColor = c;
        n.nodeCol = taggedColor;
        fakeClick();
        if(dvColor==c) {
            // check if array, if not, make it an array
            //  console.log(Object.prototype.toString.call(zparams.zdv));
            zparams.zdv = Object.prototype.toString.call(zparams.zdv) == "[object Array]" ? zparams.zdv : [];
            zparams.zdv.push(n.name);
        }
        else if(csColor==c) {
            zparams.zcross = Object.prototype.toString.call(zparams.zcross) == "[object Array]" ? zparams.zcross : [];
            zparams.zcross.push(n.name);
        }
        else if(timeColor==c) {
            zparams.ztime = Object.prototype.toString.call(zparams.ztime) == "[object Array]" ? zparams.ztime : [];
            zparams.ztime.push(n.name);
        }
        else if(nomColor==c) {
            zparams.znom = Object.prototype.toString.call(zparams.znom) == "[object Array]" ? zparams.znom : [];
            zparams.znom.push(n.name);
        }
    }

    if(c===false) {
        for (i = 0; i < n.length; i++) {
            myNode = n[i];
            if(myNode.time==="yes") {
                baseSet(myNode, timeColor);
            }
            else if(myNode.nature==="nominal") {
                baseSet(myNode, nomColor);
            }
        }
    }
    else {
        baseSet(n,c);
    }
}

// function that takes a node and rewrites strokeColor to match the property
function allNodesColors(n) {
    if(n.nature=="nominal") {
        n.strokeColor=nomColor;
    }
    if(n.time=="yes") {
        n.strokeColor=timeColor;
    }
}

function borderState () {
    if(zparams.zdv.length>0) {$('#dvButton .rectColor svg circle').attr('stroke', dvColor);}
    else {$('#dvButton').css('border-color', '#ccc');}
    if(zparams.zcross.length>0) {$('#csButton .rectColor svg circle').attr('stroke', csColor);}
    else {$('#csButton').css('border-color', '#ccc');}
    if(zparams.ztime.length>0) {$('#timeButton .rectColor svg circle').attr('stroke', timeColor);}
    else {$('#timeButton').css('border-color', '#ccc');}
    if(zparams.znom.length>0) {$('#nomButton .rectColor svg circle').attr('stroke', nomColor);}
    else {$('#nomButton').css('border-color', '#ccc');}
}

// small appearance resets, but perhaps this will become a hard reset back to all original allNode values?
function nodeReset (n) {
    n.strokeColor=selVarColor;
    n.strokeWidth="1";
    n.nodeCol=n.baseCol;
}

function subsetSelect(btn) {
    if (dataurl) {
        zparams.zdataurl = dataurl;
    }


    if(production && zparams.zsessionid=="") {
        alert("Warning: Data download is not complete. Try again soon.");
        return;
    }

    zparams.zvars = [];
    zparams.zplot = [];

    var subsetEmpty = true;

    // is this the same as zPop()?
    for (var j = 0; j < nodes.length; j++) { //populate zvars and zsubset arrays
        zparams.zvars.push(nodes[j].name);
        var temp = nodes[j].id;
        zparams.zsubset[j] = allNodes[temp].subsetrange;
        if (zparams.zsubset[j].length > 0) {
            if (zparams.zsubset[j][0] != "") {
                zparams.zsubset[j][0] = Number(zparams.zsubset[j][0]);
            }
            if (zparams.zsubset[j][1] != "") {
                zparams.zsubset[j][1] = Number(zparams.zsubset[j][1]);
            }
        }
        zparams.zplot.push(allNodes[temp].plottype);
        if (zparams.zsubset[j][1] != "") {
            subsetEmpty = false;
        } //only need to check one
    }


    if(subsetEmpty==true) {
        alert("Warning: No new subset selected.");
        return;
    }

    var outtypes = [];
    for (var j = 0; j < allNodes.length; j++) {
        outtypes.push({
            varnamesTypes: allNodes[j].name,
            nature: allNodes[j].nature,
            numchar: allNodes[j].numchar,
            binary: allNodes[j].binary,
            interval: allNodes[j].interval,
            time: allNodes[j].time
        });
    }


    var subsetstuff = {zdataurl:zparams.zdataurl, zvars:zparams.zvars, zsubset:zparams.zsubset, zsessionid:zparams.zsessionid, zplot:zparams.zplot, callHistory:callHistory, typeStuff:outtypes};

    var jsonout = JSON.stringify(subsetstuff);
    //var base = rappURL+"subsetapp?solaJSON="
    urlcall = rappURL+"subsetapp"; //base.concat(jsonout);
    var solajsonout = "solaJSON="+jsonout;

    console.log("POST out: ", solajsonout);



    function subsetSelectSuccess(btn, json) {
        console.log(json);
        selectLadda.stop(); // stop motion
        $("#btnVariables").trigger("click"); // programmatic clicks
        $("#btnModels").trigger("click");

        var grayOuts = [];

        var rCall = [];
        rCall[0] = json.call;


        // store contents of the pre-subset space
        zPop();
        var myNodes = jQuery.extend(true, [], allNodes);
        var myParams = jQuery.extend(true, {}, zparams);
        var myTrans = jQuery.extend(true, [], trans);
        var myForce = jQuery.extend(true, [], forcetoggle);
        var myPreprocess = jQuery.extend(true, {}, preprocess);
        var myLog = jQuery.extend(true, [], logArray);
        var myHistory = jQuery.extend(true, [], callHistory);


        spaces[myspace] = {"allNodes":myNodes, "zparams":myParams, "trans":myTrans, "force":myForce, "preprocess":myPreprocess, "logArray":myLog, "callHistory":myHistory};


        // remove pre-subset svg
        var selectMe = "#m".concat(myspace);
        d3.select(selectMe).attr('class', 'item');
        selectMe = "#whitespace".concat(myspace);
        d3.select(selectMe).remove();

       // selectMe = "navdot".concat(myspace);
       // var mynavdot = document.getElementById(selectMe);
       // mynavdot.removeAttribute("class");

        myspace = spaces.length;
        callHistory.push({func:"subset", zvars:jQuery.extend(true, [],zparams.zvars), zsubset:jQuery.extend(true, [],zparams.zsubset), zplot:jQuery.extend(true, [],zparams.zplot)});


      //  selectMe = "navdot".concat(myspace-1);
      //  mynavdot = document.getElementById(selectMe);

     //   var newnavdot = document.createElement("li");
     //   newnavdot.setAttribute("class", "active");
    //    selectMe = "navdot".concat(myspace);
    //    newnavdot.setAttribute("id", selectMe);
    //    mynavdot.parentNode.insertBefore(newnavdot, mynavdot.nextSibling);


        // this is to be used to gray out and remove listeners for variables that have been subsetted out of the data
        function varOut(v) {
            // if in nodes, remove
            // gray out in left panel
            // make unclickable in left panel
            for (var i = 0; i < v.length; i++) {
                var selectMe = v[i].replace(/\W/g, "_");
                document.getElementById(selectMe).style.color = hexToRgba(grayColor);
                selectMe = "p#".concat(selectMe);
                d3.select(selectMe)
                    .on("click", null);
            }
        }

        logArray.push("subset: ".concat(rCall[0]));
        showLog();
        reWriteLog();

        d3.select("#innercarousel")
            .append('div')
            .attr('class', 'item active')
            .attr('id', function () {
                return "m".concat(myspace.toString());
            })
            .append('svg')
            .attr('id', 'whitespace');
        svg = d3.select("#whitespace");


        d3.json(json.url, function(error, json) {
                if (error) return console.warn(error);
                var jsondata = json;
                var vars=jsondata["variables"];

               // console.log(jsondata);
                for(var key in jsondata["variables"]) {

                    var myIndex = findNodeIndex(key);
                	//console.log("Key Value:"+key);
                	//console.log("My index:"+myIndex);
                	//console.log("Node Index"+findNodeIndex(key));
                    allNodes[myIndex].plotx=undefined;
                    allNodes[myIndex].ploty=undefined;
                    allNodes[myIndex].plotvalues=undefined;
                    allNodes[myIndex].plottype="";
                    //allNodes[myIndex].plotx=null;
                    //allNodes[myIndex].ploty=null;
                    //allNodes[myIndex].plotvalues=null;
                    //allNodes[myIndex].plottype="";

                    jQuery.extend(true, allNodes[myIndex], jsondata.variables[key]);
                    allNodes[myIndex].subsetplot=false;
                    allNodes[myIndex].subsetrange=["",""];
                    allNodes[myIndex].setxplot=false;
                    allNodes[myIndex].setxvals=["",""];

                    if(allNodes[myIndex].valid==0) {
                        grayOuts.push(allNodes[myIndex].name);
                        allNodes[myIndex].grayout=true;
                    }
                }

                rePlot();
                populatePopover();
                layout(v="add");

                });
  //  console.log("vaalue of all nodes after subset:",allNodes);
        varOut(grayOuts);
    }


    function subsetSelectFail(btn) {
        selectLadda.stop(); //stop motion
    }

    selectLadda.start(); //start button motion
    makeCorsRequest(urlcall,btn, subsetSelectSuccess, subsetSelectFail, solajsonout);
}

function readPlotLines(url,callback){

if(typeof callback === "function") {
                callback();
            }


}



function readPreprocess(url, p, v, callback) {
    //console.log(url);
    //console.log("purl:",url);
    d3.json(url, function(error, json) {
            if (error) return console.warn(error);
            var jsondata = json;

            //console.log("inside readPreprocess function");
            //console.log(jsondata);
            //console.log(jsondata["variables"]);

            if(jsondata.dataset.private){
              private = jsondata["dataset"]["private"];
            };

            //copying the object
            for(var key in jsondata["variables"]) {
                p[key] = jsondata["variables"][key];
            }
            // console.log("we're here")
            // console.log(p);

            if(typeof callback === "function") {
                callback();
            }
            });
}

/*
function delSpace() {
    if (spaces.length===0 | (spaces.length===1 & myspace===0)) {return;}
    var lastSpace = false;
    if(myspace >= spaces.length-1) { lastSpace=true; }
    spaces.splice(myspace, 1);

    // remove current whitespace
    var selectMe = "#m".concat(myspace);
    d3.select(selectMe).attr('class', 'item');
    selectMe = "#whitespace".concat(myspace);
    d3.select(selectMe).remove();

    // remove last navdot
    selectMe = "navdot".concat(spaces.length);
    var mynavdot = document.getElementById(selectMe);
    mynavdot.parentElement.removeChild(mynavdot); // remove from parent to remove the pointer to the child

    // remove last inner carousel m
    selectMe = "m".concat(spaces.length);
    var mynavdot = document.getElementById(selectMe);
    mynavdot.parentElement.removeChild(mynavdot);

    if(lastSpace) { myspace = myspace-1; }

    selectMe = "navdot".concat(myspace);
    newnavdot = document.getElementById(selectMe);
    newnavdot.setAttribute("class", "active");

    // add whitespace back in to current inner carousel m
    selectMe = "#m".concat(myspace);
    d3.select(selectMe).attr('class', 'item active')
    .append('svg').attr('id', function(){
                        return "whitespace".concat(myspace);
                        });

    allNodes = jQuery.extend(true, [], spaces[myspace].allNodes);
    zparams = jQuery.extend(true, {}, spaces[myspace].zparams);
    trans = jQuery.extend(true, [], spaces[myspace].trans);
    forcetoggle = jQuery.extend(true, [], spaces[myspace].force);
    preprocess = jQuery.extend(true, {}, spaces[myspace].preprocess);

    selectMe = "#whitespace".concat(myspace);
    svg = d3.select(selectMe);

    layout(v="move");
}


// for the following three functions, the general idea is to store the new information for the current space, and then move myspace according (right: +1, left: -1, addSpace: spaces.length)
function addSpace() {

    zPop();

    // everything we need to save the image of the current space.
    var myNodes = jQuery.extend(true, [], allNodes); // very important. this clones the allNodes object, and may slow us down in the future.  if user hits plus 4 times, we'll have four copies of the same space in memory.  certainly a way to optimize this
    var myParams = jQuery.extend(true, {}, zparams);
    var myTrans = jQuery.extend(true, [], trans);
    var myForce = jQuery.extend(true, [], forcetoggle);
    var myPreprocess = jQuery.extend(true, {}, preprocess);
    var myLog = jQuery.extend(true, [], logArray);
    var myHistory = jQuery.extend(true, [], callHistory);


    spaces[myspace] = {"allNodes":myNodes, "zparams":myParams, "trans":myTrans, "force":myForce, "preprocess":myPreprocess, "logArray":myLog, "callHistory":myHistory};

    var selectMe = "#m".concat(myspace);
    d3.select(selectMe).attr('class', 'item');
    selectMe = "#whitespace".concat(myspace);
    d3.select(selectMe).remove();

    selectMe = "navdot".concat(myspace);
    var mynavdot = document.getElementById(selectMe);
    mynavdot.removeAttribute("class");

    myspace = spaces.length;

    selectMe = "navdot".concat(myspace-1);
    mynavdot = document.getElementById(selectMe);

    var newnavdot = document.createElement("li");
    newnavdot.setAttribute("class", "active");
    selectMe = "navdot".concat(myspace);
    newnavdot.setAttribute("id", selectMe);
    mynavdot.parentNode.insertBefore(newnavdot, mynavdot.nextSibling);

    d3.select("#innercarousel")
    .append('div')
    .attr('class', 'item active')
    .attr('id', function(){
          return "m".concat(myspace.toString());
          })
    .append('svg')
    .attr('id', 'whitespace');
    svg = d3.select("#whitespace");

    layout(v="add");

}

function left() {

    zPop();

    var myNodes = jQuery.extend(true, [], allNodes); // very important. this clones the allNodes object, and may slow us down in the future.  if user hits plus 4 times, we'll have four copies of the same space in memory.  certainly a way to optimize this
    var myParams = jQuery.extend(true, {}, zparams);
    var myTrans = jQuery.extend(true, [], trans);
    var myForce = jQuery.extend(true, [], forcetoggle);
    var myPreprocess = jQuery.extend(true, {}, preprocess);
    var myLog = jQuery.extend(true, [], logArray);
    var myHistory = jQuery.extend(true, [], callHistory);

    if(typeof spaces[myspace] === "undefined") {
        spaces.push({"allNodes":myNodes, "zparams":myParams, "trans":myTrans, "force":myForce, "preprocess":myPreprocess, "logArray":myLog, "callHistory":myHistory});
    }
    else {
        spaces[myspace] = {"allNodes":myNodes, "zparams":myParams, "trans":myTrans, "force":myForce, "preprocess":myPreprocess, "logArray":myLog, "callHistory":myHistory};
    }

    if(myspace===0) {
        myspace=spaces.length-1; // move to last when left is click at 0
    }
    else {
        myspace = myspace-1;
    }

    selectMe = "#m".concat(myspace);
    d3.select(selectMe)
    .append('svg').attr('id', function(){
                        return "whitespace".concat(myspace);
                        });

    allNodes = jQuery.extend(true, [], spaces[myspace].allNodes);
    zparams = jQuery.extend(true, {}, spaces[myspace].zparams);
    trans = jQuery.extend(true, [], spaces[myspace].trans);
    forcetoggle = jQuery.extend(true, [], spaces[myspace].force);
    preprocess = jQuery.extend(true, {}, spaces[myspace].preprocess);
    logArray = jQuery.extend(true, [], spaces[myspace].logArray);
    callHistory = jQuery.extend(true, [], spaces[myspace].callHistory);

    selectMe = "#whitespace".concat(myspace);
    svg = d3.select(selectMe);

    rePlot();
    layout(v="move");

    selectMe = "navdot".concat(myspace);
    newnavdot = document.getElementById(selectMe);
    newnavdot.setAttribute("class", "active");

    if(myspace===spaces.length-1) {
        myspace=0;
    }
    else {
        myspace = myspace+1;
    }

    selectMe = "navdot".concat(myspace);
    var mynavdot = document.getElementById(selectMe);
    mynavdot.removeAttribute("class", "active");

    selectMe = "#whitespace".concat(myspace);
    d3.select(selectMe).remove();

    if(myspace===0) {
        myspace=spaces.length-1; // move to last when left is click at 0
    }
    else {
        myspace = myspace-1;
    }


    if(forcetoggle[0]==="false") {
        document.getElementById('btnForce').setAttribute("class", "btn active");
    }
    else {
        document.getElementById('btnForce').setAttribute("class", "btn btn-default");
    }

    d3.select("#models").selectAll("p").style("background-color", varColor);
    selectMe = "#_model_".concat(zparams.zmodel);
    d3.select(selectMe).style("background-color", hexToRgba(selVarColor));

    selectMe = "#whitespace".concat(myspace);
    svg = d3.select(selectMe);

    legend();
    showLog();
    reWriteLog();

 //   event.preventDefault();

}

function right() {
    zPop();
    var myNodes = jQuery.extend(true, [], allNodes);
    var myParams = jQuery.extend(true, {}, zparams);
    var myTrans = jQuery.extend(true, [], trans);
    var myForce = jQuery.extend(true, [], forcetoggle);
    var myPreprocess = jQuery.extend(true, {}, preprocess);
    var myLog = jQuery.extend(true, [], logArray);
    var myHistory = jQuery.extend(true, [], callHistory);

    spaces[myspace] = {"allNodes":myNodes, "zparams":myParams, "trans":myTrans, "force":myForce, "preprocess":myPreprocess, "logArray":myLog,"callHistory":myHistory};


    if(myspace===spaces.length-1) {
        myspace=0; // move to last when left is click at 0
    }
    else {
        myspace = myspace+1;
    }

    selectMe = "#m".concat(myspace);
    d3.select(selectMe)
    .append('svg').attr('id', function(){
                        return "whitespace".concat(myspace);
                        });

    allNodes = jQuery.extend(true, [], spaces[myspace].allNodes);
    zparams = jQuery.extend(true, {}, spaces[myspace].zparams);
    trans = jQuery.extend(true, [], spaces[myspace].trans);
    forcetoggle = jQuery.extend(true, [], spaces[myspace].force);
    preprocess = jQuery.extend(true, {}, spaces[myspace].preprocess);
    logArray = jQuery.extend(true, [], spaces[myspace].logArray);
    callHistory = jQuery.extend(true, [], spaces[myspace].callHistory);

    selectMe = "#whitespace".concat(myspace);
    svg = d3.select(selectMe);

    rePlot();
    layout(v="move");

    if(myspace===0) {
        myspace=spaces.length-1;
    }
    else {
        myspace = myspace-1;
    }

    selectMe = "navdot".concat(myspace);
    var mynavdot = document.getElementById(selectMe);
    mynavdot.removeAttribute("class", "active");

    selectMe = "#whitespace".concat(myspace);
    d3.select(selectMe).remove();

    if(myspace===spaces.length-1) {
        myspace=0; // move to last when left is click at 0
    }
    else {
        myspace = myspace+1;
    }

    selectMe = "navdot".concat(myspace);
    var newnavdot = document.getElementById(selectMe);
    newnavdot.setAttribute("class", "active");

    if(forcetoggle[0]==="false") {
        document.getElementById('btnForce').setAttribute("class", "btn active");
    }
    else {
        document.getElementById('btnForce').setAttribute("class", "btn btn-default");
    }

    d3.select("#models").selectAll("p").style("background-color", varColor);
    selectMe = "#_model_".concat(zparams.zmodel);
    d3.select(selectMe).style("background-color", hexToRgba(selVarColor));

    selectMe = "#whitespace".concat(myspace);
    svg = d3.select(selectMe);

    legend();
    showLog();
    reWriteLog();

  //  event.preventDefault();
}

*/

function about() {
    $('#about').show();
}

function closeabout() {
    $('#about').hide();
}

function opencite() {
    $('#cite').show();
}

function closecite(toggle) {
    if(toggle==false) {
        $('#cite').hide();
    }
}

function clickcite(toggle) {
    if(toggle==false) {
        $('#cite').show();
        return true;
    }else {
        $('#cite').hide();
        return false;
    }
}
// function to remove all the children svgs inside subset and setx divs
function rePlot() {

        d3.select("#tab2")
        .selectAll("svg")
        .remove();

        d3.select("#setx")
        .selectAll("svg")
        .remove();

    // make this smarter
    for(var i = 0; i<allNodes.length; i++) {
        allNodes[i].setxplot=false;
        allNodes[i].subsetplot=false;
    }
}

function showLog() {
    if(logArray.length > 0) {
        document.getElementById('logdiv').setAttribute("style", "display:block");
        d3.select("#collapseLog div.panel-body").selectAll("p")
                     .data(logArray)
                     .enter()
                     .append("p")
                     .text(function(d){
                           return d;
                           });
    }
    else {
        document.getElementById('logdiv').setAttribute("style", "display:none");
    }
}

function reWriteLog() {
    d3.select("#collapseLog div.panel-body").selectAll("p")
    .remove();
    d3.select("#collapseLog div.panel-body").selectAll("p")
    .data(logArray)
    .enter()
    .append("p")
    .text(function(d){
          return d;
          });
}


// acts as if the user clicked in whitespace. useful when restart() is outside of scope
function fakeClick() {
    myspace = spaces.length;
    var myws = "#whitespace".concat(myspace);
    // d3 and programmatic events don't mesh well, here's a SO workaround that looks good but uses jquery...
    jQuery.fn.d3Click = function () {
        this.each(function (i, e) {
                  var evt = document.createEvent("MouseEvents");
                  evt.initMouseEvent("mousedown", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

                  e.dispatchEvent(evt);
                  });
    };
    $(myws).d3Click();

    d3.select(myws)
    .classed('active', false); // remove active class
}


function d3date() {
//    Code is located in app_ddi_eventdata_date.js
}

var d3loc_draw = false;
function d3loc() {
//<<<<<<< HEAD
	if(!d3loc_draw) {
		d3loc_draw = true;
		drawMainGraph();
	}
/*=======

	drawMainGraph();
>>>>>>> Marcus_EventDataSubset*/
}

function d3action() {
}

var actorDisplayed = false;
function d3actor() {
	if (!actorDisplayed) {
		$(document).ready(function() {
			//update display variables

			actorWidth = actorSVG.node().getBoundingClientRect().width;
			actorHeight = actorSVG.node().getBoundingClientRect().height;

			boundaryLeft = Math.floor(actorWidth/2) - 20;
			boundaryRight = Math.ceil(actorHeight/2) + 20;

			actorSVG.append("path").attr("d", function() {
				return "M" + actorWidth/2 + "," + 0 + "V" + actorHeight;
			}).attr("stroke", "black");
			
			actorForce.stop();
            actorForce = actorForce.force('X', d3.forceX(actorWidth))
                          .force('Y', d3.forceY(actorHeight))
                          .restart();
			updateAll();
			actorDisplayed = true;
		});
	}

}
//actor code moved to app_ddi_eventdata_actor.js

/**
 * Variables declared for location
 *
 **/
 var mapGraphSVG = new Object();
 var mapSubGraphIdCname = new Object();
 var mapListCountriesSelected = new Object();

 function resetLocationVariables() {

	mapGraphSVG = new Object();
	mapSubGraphIdCname = new Object();
	mapListCountriesSelected = new Object();
 }


/**
 * Draw the main graph
 *
 **/

function drawMainGraph() {

	if(mapGraphSVG["main_graph"] != null) {
		return;
	}

	$("#subsetLocation").append('<div class="container"><div id="subsetLocation_panel" class="row"></div></div>');

	$("#subsetLocation_panel").append("<div class='col-xs-4' id='subsetLocationDivL'></div>");
	$("#subsetLocation_panel").append("<div class='col-xs-4 location_right'><div class='affix' id='subsetLocationDivR'></div></div>");

	$("#subsetLocationDivL").append("<table id='svg_graph_table' border='1' align='center'><tr><td id='main_graph_td' class='graph_config'></td></tr></table>");

	$("#subsetLocationDivR").append('<div align="center"><table id="country_table" border="1" align="center"><tr><td>Location: <label style="cursor:pointer"><span class="glyphicon glyphicon-repeat glyphicon_border" onclick="javascript:removeFromCountryList(\'reset_all\')"></span></label></td></tr><tr><th>List of Selected Countries</th></tr><tr><td id="country_list"></td></tr></table></div>');

	$("#country_list").append("<div style='height:300px; overflow-y: scroll;'><table align='center' id='country_list_tab'></table></div>");

	$("#subsetLocationDivR").append('<div align="center"><br/><br/><button onclick="javascript:locationStage();">Stage</button></div>');

	mainGraphLabel();

	var svg = d3.select("#main_graph_td").append("svg:svg")
        .attr("width",  500)
        .attr("height", 350)
		.attr("id", "main_graph_svg");

	mapGraphSVG["main_graph"] = svg;

	render(false, 0);
}


/**
 * render to render/draw the main/sub graph with the data provided in form of array of Objects
 * with the links to create the sub-graph based on the data
 *
**/
var arr_location_region_data = [];
var map_location_rid_rname = new Map();
var map_location_lookup = new Map();

function render(blnIsSubgraph, cid){

	console.log(cid);

	if(!blnIsSubgraph) {

		console.log("Rendering Main Graph...");

		var maxDomainX = 1;
		var svg = d3.select("#main_graph_svg");
		var margin = {top: 20, right: 20, bottom: 30, left: 135},
		width = +svg.attr("width") - margin.left - margin.right,
		height = +svg.attr("height") - margin.top - margin.bottom;

		var x = d3.scaleLinear().range([0, width]);
		var y = d3.scaleBand().range([height, 0]);

		svg.append("defs").append("pattern")
			.attr("id", "pattern1")
			.attr("x", "10")
			.attr("y", "10")
			.attr("width", y.bandwidth()/20)
			.attr("height", y.bandwidth()/20)
			.attr("patternUnits", "userSpaceOnUse")
			.append("line")
			.attr("x1","0")
			.attr("y1","0")
			.attr("x2", y.bandwidth()/20)
			.attr("y2", y.bandwidth()/20)
			.attr("style", "stroke:brown;stroke-width:5;");

		d3.tsv("data/locationplot.tsv", getMapLocationLookup(), function(data) {

			var rid = -1;
			data.forEach(function(d) {

				var region = "Other";

				if(map_location_lookup.has(d.cname)) {

					region = map_location_lookup.get(d.cname);
				}
				else if(map_location_lookup.has(d.fullcname)) {

					region = map_location_lookup.get(d.fullcname);
				}

				if(!map_location_rid_rname.has(region)) {

					rid++;
					var arr_countries = [];
					arr_countries.push(d);

					var arr_country_names = [];
					arr_country_names.push(d.cname);

					var rdata = new Object();
					rdata.rid = rid;
					rdata.rname = region;
					rdata.freq = 1;
					rdata.maxCFreq = d.freq;
					rdata.countries = arr_countries;
					rdata.country_names = arr_country_names;

					arr_location_region_data[rid] = rdata;

					map_location_rid_rname.set(region, "" + rid);
					map_location_rid_rname.set("" + rid, region);

				}
				else {

					var currrid = map_location_rid_rname.get(region);
					var rdata = arr_location_region_data[currrid];
					var freq = rdata.freq + 1;
					rdata.freq = freq;
					rdata.countries.push(d);
					rdata.country_names.push(d.cname);

					var cFreq = parseInt(d.freq);
					if(cFreq > rdata.maxCFreq) {
						rdata.maxCFreq = cFreq;
					}

					arr_location_region_data[currrid] = rdata;

					if(freq > maxDomainX) {
						maxDomainX = freq;
					}
				}

			});


			x.domain([0, maxDomainX]);
			y.domain(arr_location_region_data.map(function(d) {return d.rname;})).padding(0.1);

			var g = svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			g.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(x).ticks(5).tickFormat(function(d) { return parseInt(d); }).tickSizeInner([-height]));

			g.append("g")
			.attr("class", "y axis")
			.call(d3.axisLeft(y));


			g.selectAll(".bar")
				.data(arr_location_region_data)
				.enter()
				.append("rect")
				.attr("class", "bar")
				.attr("x", 0)
				.attr("height", y.bandwidth())
				.attr("y", function(d) { return y(d.rname); })
				.attr("width", function(d) { return x(d.freq); })
				.attr("onclick",  function (d) { mapGraphSVG[d.rid] = null; return "javascript:constructSubgraph('"+d.rid+"')"; })
				.attr("id", function(d) { return "tg_rect_" + d.rid; });

			g.selectAll(".bar_label")
				.data(arr_location_region_data)
				.enter()
				.append("text")
				.attr("class", "bar_label")
				.attr("x", function (d) { return x(d.freq) + 5;})
				.attr("y", function (d) { return y(d.rname) + y.bandwidth() / 2 + 4;})
				.text(function (d) { return "" + d.freq;});

			g.append("text")
				.attr("text-anchor", "middle")
				.attr("transform", "translate("+ (-115) +","+(height/2)+")rotate(-90)")
				.attr("class", "graph_axis_label")
				.text("Region");



			g.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate("+ (width/2) +","+(height+30)+")")
			.attr("class", "graph_axis_label")
            .text("Frequency");


		});
	}
	else {

		console.log("Rendering Sub Graph...");

		var MAX_HEIGHT = 35;
		var arr_countries = arr_location_region_data[cid].countries;
		var maxDomainX = arr_location_region_data[cid].maxCFreq;

		var svg = d3.select("#sub_graph_td_svg_"+ cid);

		var margin = {top: 20, right: 30, bottom: 30, left: 80},
		width = +svg.attr("width") - margin.left - margin.right,
		height = +svg.attr("height") - margin.top - margin.bottom;

		var x = d3.scaleLinear().range([0, width]);
		var y = d3.scaleBand().range([height, 0]);

		console.log(maxDomainX);

		x.domain([0, maxDomainX]);
		y.domain(arr_countries.map(function(d) {return d.cname;})).padding(0.1);

			var g = svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			g.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(x).ticks(5).tickFormat(function(d) { return parseInt(d); }).tickSizeInner([-height]));

			g.append("g")
			.attr("class", "y axis")
			.call(d3.axisLeft(y));


			g.selectAll(".bar")
			.data(arr_countries)
			.enter().append("rect")
			.attr("class", "bar")
			.attr("x", 0)
			.attr("height", d3.min([y.bandwidth(), MAX_HEIGHT]))
			.attr("y", function(d) {
			mapSubGraphIdCname[d.cname] = cid + "_" + d.id;
			if(mapListCountriesSelected[d.cname] == null) {mapListCountriesSelected[d.cname] = false;}
			return y(d.cname) +  + (y.bandwidth() - d3.min([y.bandwidth(), MAX_HEIGHT]))/2; })
			.attr("width", function(d) { return x(d.freq); })
			.attr("onclick",  function (d) { return "javascript:subgraphYLabelClicked('"+d.cname+"')"; })
			.attr("id", function(d) { return "tg_rect_" + cid + "_" + d.id; })
			.append("svg:title")
			.text(function(d) { return d.fullcname; });

			g.selectAll(".bar_label")
			.data(arr_countries)
			.enter()
			.append("text")
            .attr("class", "bar_label")
			.attr("x", function (d) { return x(d.freq) + 5;})
            .attr("y", function (d) { return y(d.cname) + y.bandwidth() / 2 + 4;})
            .text(function (d) { return "" + d.freq;});

			g.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate("+ (-50) +","+(height/2)+")rotate(-90)")
			.attr("class", "graph_axis_label")
            .text("Sub-Region of " + map_location_rid_rname.get(cid));

			g.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate("+ (width/2) +","+(height+30)+")")
			.attr("class", "graph_axis_label")
            .text("Frequency");

	}

}

/**
 * constructSubgraph by the rname or id of the main graph
 * and do the rendering of the sub graph
 *
**/
function constructSubgraph(cid) {

	console.log("constructSubgraph for cid : " + cid);

	if(mapGraphSVG[cid] != null) {

		subgraphAction('expand_collapse_text_'+cid);

		return;
	}

	if(mapGraphSVG[cid + "_removed"] != null) {

		mapGraphSVG[cid] = mapGraphSVG[cid + "_removed"];
		mapGraphSVG[cid + "_removed"] = null;

		$("#sub_graph_td_"+cid).parent().show();
		$("#sub_graph_td_" + cid).removeClass('graph_close');
		$("#sub_graph_td_" + cid).addClass('graph_config');

		return;
	}

	$("#svg_graph_table").append('<tr id="sub_graph_tr_'+cid +'"><td id="sub_graph_td_'+cid +'" class="graph_config"></td></tr>');
	subGraphLabel(cid);

	var svg = d3.select("#sub_graph_td_"+cid).append("svg:svg")
       .attr("width",  500)
       .attr("height", 350)
	   .attr("id", "sub_graph_td_svg_"+cid);

	mapGraphSVG[cid] = svg;
	render(true, cid);
}

/**
 * maingraphAction -> to map the header function {All, None, Expand/Collapse} for the main graph
 *
 **/
function maingraphAction(action) {

	if(action == 'Expand_Collapse') {

		action = $('#Expand_Collapse_Main_Text').text();
	}

	if(action == 'All') {

		for(var cid in mapGraphSVG) {

			if(cid.indexOf("_removed") > -1) {
				continue;
			}

			if(mapGraphSVG[cid] == null) {
				console.log("SVG CREATE = " + cid);
				constructSubgraph(cid);
			}
			else if(mapGraphSVG[cid + "_removed"] == null) {

				console.log("SVG SHOW = " + cid);
				$("#sub_graph_td_"+cid).parent().show();
				$("#sub_graph_td_" + cid).removeClass('graph_close');
				$("#sub_graph_td_" + cid).addClass('graph_config');
			}
			else if(mapGraphSVG[cid] != null) {

				console.log("SVG NO_ACTION = " + cid);
			}
		}

	}
	else if(action == 'None') {

		removeAllSubGraphSVG();
	}
	else if(action == 'Collapse') {

		$("#Expand_Collapse_Main_Text").text("Expand");

		$("#Exp_Col_Icon").removeClass("glyphicon-resize-small");
		$("#Exp_Col_Icon").addClass("glyphicon-resize-full");


		$("#main_graph_td").removeClass('graph_config');
		$("#main_graph_td").addClass('graph_collapse');
	}
	else if(action == 'Expand') {

		$("#Expand_Collapse_Main_Text").text("Collapse");

		$("#Exp_Col_Icon").removeClass("glyphicon-resize-full");
		$("#Exp_Col_Icon").addClass("glyphicon-resize-small");

		$("#main_graph_td").removeClass('graph_collapse');
		$("#main_graph_td").addClass('graph_config');
	}
}


/**
 * subgraphAction-> to map the subgraph function {All, None, Expand/Collapse}
 *
 **/
function subgraphAction(textId) {


	if(textId.indexOf("expand_collapse_text_") != -1) {

		var action = $("#" + textId).text();

		if(action == 'Collapse') {

			var cid = textId.substring(21);

			$("#"+textId).text("Expand");

			$("#Exp_Col_Icon_"+cid).removeClass("glyphicon-resize-small");
			$("#Exp_Col_Icon_"+cid).addClass("glyphicon-resize-full");

			$("#sub_graph_td_" + cid).removeClass('graph_config');
			$("#sub_graph_td_" + cid).addClass('graph_collapse');

		}
		else if(action == 'Expand') {

			var cid = textId.substring(21);

			$("#"+textId).text("Collapse");

			$("#Exp_Col_Icon_"+cid).removeClass("glyphicon-resize-full");
			$("#Exp_Col_Icon_"+cid).addClass("glyphicon-resize-small");

			$("#sub_graph_td_" + cid).removeClass('graph_collapse');
			$("#sub_graph_td_" + cid).addClass('graph_config');
		}
	}
	else {

		var actionData = textId.split("_");
		var action = actionData[0];
		var cid = actionData[1];

		var listCname = arr_location_region_data[cid].country_names;
		var bool = true;
		if(action == 'All') {
			bool = true;
		}
		else if(action == 'None') {
			bool = false;
		}

		for(var index in listCname) {
			var cname = listCname[index];
			mapListCountriesSelected[cname] = bool;
		}

		updateCountryList();
	}
}


/**
 * removeAllSubGraphSVG - to remove all the subgraph when clicked on "None" in the main graph
 *
 **/
function removeAllSubGraphSVG(){

	for(var cid in mapGraphSVG) {

		if(cid.indexOf("_removed") > -1) {
				continue;
		}

		if(cid != null && mapGraphSVG[cid] != null) {

			var svgToRemove = mapGraphSVG[cid];
			mapGraphSVG[cid + "_removed"] = svgToRemove;
			mapGraphSVG[cid] = null;

			$("#sub_graph_td_" + cid).removeClass('graph_config');
			$("#sub_graph_td_" + cid).addClass('graph_close');
			$("#sub_graph_td_"+cid).parent().hide();
		}
	}
}

function subgraphYLabelClicked(cname) {

	var bool = mapListCountriesSelected[cname];

	if(bool == true) {
		mapListCountriesSelected[cname] = false;
	}
	else {
		mapListCountriesSelected[cname] = true;
	}

	updateCountryList();
}

/**
 * mainGraphLabel - to put the header Labels in the main graph
 *
 **/
function mainGraphLabel() {

	$("#main_graph_td").append('<div id="main_graph_td_div"></div>');

	var label = $('<label align="right" id="Region">Region:</label>');
	$("#main_graph_td_div").append(label);
	$("#main_graph_td_div").append("&nbsp; &nbsp; &nbsp;");


	var label11 = $('<label title="Expand All"><span class="glyphicon gi-2x glyphicon_border"><label style="cursor:pointer; text-align:center; width:100px;" align="right" id="Main_All" onclick = "javascript:maingraphAction(\'All\')">All</label></span></label>');
	var label12 = $('<label title="Collapse All"><span class="glyphicon gi-2x glyphicon_border"><label style="cursor:pointer; text-align:center; width:100px;" align="right" id="Main_None" onclick = "javascript:maingraphAction(\'None\')">None</label></span></label>');
	$("#main_graph_td_div").append(label11);
	$("#main_graph_td_div").append("&nbsp; &nbsp; &nbsp;");
	$("#main_graph_td_div").append(label12);
	$("#main_graph_td_div").append("&nbsp; &nbsp; &nbsp;");

	var label2 = $('<label align="right" id="Expand_Collapse_Main_Text" class="hide_label">Collapse</label>');
	$("#main_graph_td_div").append(label2);
	var label3 = $('<label style="cursor:pointer"><span class="glyphicon glyphicon-resize-small gi-2x glyphicon_border" id="Exp_Col_Icon" onclick = "javascript:maingraphAction(\'Expand_Collapse\')"></span></label>');
	$("#main_graph_td_div").append(label3);

}

/**
 * subGraphLabel - to put the header Labels in the sub graph
 *
 **/
function subGraphLabel(cid) {

	$("#sub_graph_td_"+cid).append('<div id="sub_graph_td_div_'+cid+'"></div>');

	var cname = map_location_rid_rname.get(cid);
	var label1 = $('<label align="right">'+cname+':</label>');
	$("#sub_graph_td_div_"+cid).append(label1);
	$("#sub_graph_td_div_"+cid).append("&nbsp;&nbsp;&nbsp;");

	var label11 = $('<label title="Select All"><span class="glyphicon gi-2x glyphicon_border"><label style="cursor:pointer; text-align:center; width:100px;" align="right" onclick = "javascript:subgraphAction(\'All_'+cid+'\')">All</label></span></label>');
	var label12 = $('<label title="Remove All"><span class="glyphicon gi-2x glyphicon_border"><label style="cursor:pointer; text-align:center; width:100px;" align="right" onclick = "javascript:subgraphAction(\'None_'+cid+'\')">None</label></span></label>');
	$("#sub_graph_td_div_"+cid).append(label11);
	$("#sub_graph_td_div_"+cid).append("&nbsp; &nbsp; &nbsp;");
	$("#sub_graph_td_div_"+cid).append(label12);
	$("#sub_graph_td_div_"+cid).append("&nbsp; &nbsp; &nbsp;");


	var label2 = $('<label style="cursor:pointer"><span class="glyphicon glyphicon-resize-small gi-2x glyphicon_border" id="Exp_Col_Icon_'+cid+'" onclick="javascript:subgraphAction(\'expand_collapse_text_'+cid+'\')"></span></label>');
	$("#sub_graph_td_div_"+cid).append(label2);

	var label = $('<label class="hide_label" id="expand_collapse_text_'+cid+'">Collapse</label>');
	$("#sub_graph_td_div_"+cid).append(label);
}

function updateCountryList() {

	var td_id = 'country_list_tab';
	$("#"+td_id).empty();

	var mapLocalMainGraphIdWithSubGraphCnameList = new Object();

	for(var country in mapListCountriesSelected) {

		var bool = mapListCountriesSelected[country];
		var main_subGraphId = mapSubGraphIdCname[country];

		var arrIds = main_subGraphId.split("_");
		var mainGraphId = arrIds[0];

		if(mapLocalMainGraphIdWithSubGraphCnameList[mainGraphId] == null) {
			mapLocalMainGraphIdWithSubGraphCnameList[mainGraphId] = [];
		}

		if(bool == true) {
			$("#country_list_tab").append('<tr><td><label class="strike_through" style="cursor:pointer" onclick="javascript:removeFromCountryList(\''+country+'\');">' + country +'</label></td></tr>');
			$("#tg_rect_"+ main_subGraphId).attr("class", "bar_all_selected");
			mapLocalMainGraphIdWithSubGraphCnameList[mainGraphId].push(country);

		}
		else {

			$("#tg_rect_"+ main_subGraphId).attr("class", "bar");
		}
	}

	for(var mainGraphCid in arr_location_region_data) {

		var originalLength = arr_location_region_data[mainGraphCid].country_names.length;
		var localLength = (mapLocalMainGraphIdWithSubGraphCnameList[mainGraphCid] == null? 0 : mapLocalMainGraphIdWithSubGraphCnameList[mainGraphCid].length);

		if(localLength == 0) {
			$("#tg_rect_"+ mainGraphCid).attr("class", "bar");
		}
		else if(localLength < originalLength) {
			$("#tg_rect_"+ mainGraphCid).attr("class", "bar_some_selected");
		}
		else if(localLength == originalLength) {
			$("#tg_rect_"+ mainGraphCid).attr("class", "bar_all_selected");
		}

	}
}

function removeFromCountryList(cname) {

	if(cname == 'reset_all') {

		for(var country in mapListCountriesSelected) {
			mapListCountriesSelected[country] = false;
		}

	}
	else {

		mapListCountriesSelected[cname] = false;
	}
	updateCountryList();

}

function locationStage() {

	var lstLocation = [];

	for(var country in mapListCountriesSelected) {
		var bool = mapListCountriesSelected[country];
		if(bool) {
			lstLocation.push(country);
		}
	}

	alert("Location = [ " + lstLocation + " ]");
}

window.onresize = rightpanelMargin;
rightpanelMargin();

function rightpanelMargin() {
    main = $("#main");
    if (main.get(0).scrollHeight > main.get(0).clientHeight) {
        // Vertical scrollbar
        document.getElementById("rightpanel").style.right = "27px";
        if ($('#rightpanel').hasClass('closepanel')) {
            document.getElementById("stageButton").style.right = "56px"
        } else {
            document.getElementById("stageButton").style.right = "286px"
        }
    } else {
        // No vertical scrollbar
        document.getElementById("rightpanel").style.right = "10px";
        if ($('#rightpanel').hasClass('closepanel')) {
            document.getElementById("stageButton").style.right = "40px"
        } else {
            document.getElementById("stageButton").style.right = "270px"
        }
    }

    if (main.get(0).scrollWidth > main.get(0).clientWidth) {
        // Horizontal scrollbar
        document.getElementById("rightpanel").style.height = "calc(100% - 139px)";
        document.getElementById("stageButton").style.bottom = "73px";
    } else {
        // No horizontal scrollbar
        document.getElementById("rightpanel").style.height = "calc(100% - 122px)";
        document.getElementById("stageButton").style.bottom = "56px";
    }
}

function getMapLocationLookup() {

	d3.csv("data/locationlookup.csv", function(data) {

		data.forEach(function(d) {
			map_location_lookup.set(d.cname , d.rname);
			map_location_lookup.set(d.fullcname , d.rname);
		});
	});
}
