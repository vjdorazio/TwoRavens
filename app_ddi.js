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


// Kripanshu testing.

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

// space index
var myspace = 0;
var svg = d3.select("#main.left div.carousel-inner").attr('id', 'innercarousel')
.append('div').attr('class', 'item active').attr('id', 'm0').append('svg').attr('id', 'whitespace');

var logArray = [];


//.attr('width', width)
//.attr('height', height);
var tempWidth = d3.select("#main.left").style("width")
var width = tempWidth.substring(0,(tempWidth.length-2));

/*var tempHeight = d3.select("#main.left").style("height")
var height = tempHeight.substring(0,(tempHeight.length-2));*/

var height = $(window).height() -120;  // Hard coding for header and footer and bottom margin.


var forcetoggle=["true"];
var estimated=false;
var estimateLadda = Ladda.create(document.getElementById("btnEstimate"));
var selectLadda = Ladda.create(document.getElementById("btnSelect"));
var rightClickLast = false;


// this is the initial color scale that is used to establish the initial colors of the nodes.  allNodes.push() below establishes a field for the master node array allNodes called "nodeCol" and assigns a color from this scale to that field.  everything there after should refer to the nodeCol and not the color scale, this enables us to update colors and pass the variable type to R based on its coloring
var colors = d3.scale.category20();

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

var lefttab = "tab1"; //global for current tab in left panel
var righttab = "btnUnivariate"; // global for current tab in right panel

var zparams = { zdata:[], zedges:[], ztime:[], znom:[], zcross:[], zmodel:"", zvars:[], zdv:[], zdataurl:"", zsubset:[], zsetx:[], zmodelcount:0, zplot:[], zsessionid:"", zdatacite:"", zmetadataurl:"", zusername:""};

var json_data_explore="empty";
// Radius of circle
var allR = 40;

//Width and height for histgrams
var barwidth = 1.3*allR;
var barheight = 0.5*allR;
var barPadding = 0.35;
var barnumber =7;


var arc0 = d3.svg.arc()
.innerRadius(allR + 5)
.outerRadius(allR + 20)
.startAngle(0)
.endAngle(3.2);

var arc1 = d3.svg.arc()
.innerRadius(allR + 5)
.outerRadius(allR + 20)
.startAngle(0)
.endAngle(1);

var arc2 = d3.svg.arc()
.innerRadius(allR + 5)
.outerRadius(allR + 20)
.startAngle(1.1)
.endAngle(2.2);

var arc3 = d3.svg.arc()
.innerRadius(allR + 5)
.outerRadius(allR + 20)
.startAngle(2.3)
.endAngle(3.3);

var arc4 = d3.svg.arc()
.innerRadius(allR + 5)
.outerRadius(allR + 20)
.startAngle(4.3)
.endAngle(5.3);

// to draw circle on the ends of the link:path
var circledata = [
    { id: 0, name: 'circle', path: 'M 0, 0  m -5, 0  a 5,5 0 1,0 10,0  a 5,5 0 1,0 -10,0', viewbox: '-6 -6 12 12' }
]
// From .csv
var dataset2 = [];
var valueKey = [];
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
var transformList = ["log(d)", "exp(d)", "d^2", "sqrt(d)", "interact(d,e)"];

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
                     .text(function(d){
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
$('#about div.panel-body').text('TwoRavens v0.1 "Dallas" --  The Norse god Odin had two talking ravens as advisors, who would fly out into the world and report back all they observed.  In the Norse, their names were "Thought" and "Memory".  In our coming release, our thought-raven automatically advises on statistical model selection, while our memory-raven accumulates previous statistical univariate from Dataverse, to provide cummulative guidance and meta-analysis.'); //This is the first public release of a new, interactive Web application to explore data, view descriptive statistics, and estimate statistical models.";




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
    // neither a full ddi url, nor file id supplied; use one of the sample DDIs that come with
    // the app, in the data directory:
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
} else {
    // no dataurl/file id supplied; use one of the sample data files distributed with the
    // app in the "data" directory:
    //pURL = "data/preprocess2429360.txt";   // This is the Strezhnev Voeten JSON data
   // pURL = "data/fearonLaitin.json";     // This is the Fearon Laitin JSON data
    //pURL = "data/fearonLaitinNewPreprocess3long.json";     // This is the revised (May 29, 2015) Fearon Laitin JSON data
    purltest="users/"+username+"/fearonLaitinDatapreprocess.json"
    //This is testing whether a newer json file exists or not. if yes, we will use that file, else use the default file
   var test=UrlExists(purltest);
   if(test==true){
      pURL = purltest;
     // console.log("test is true");
    }
   else
       console.log("loading fearonLaitinpreprocess8.json");
   	pURL = "data/fearonLaitinpreprocess8.json";

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
    //pURL = "data/fearonLaitinPreprocess4.json";

    //console.log(purltest);
   // console.log(pURL);
	//pURL = "data/preprocessPUMS5small.json";   // This is California PUMS subset
    //pURL = "data/FL_insurance_sample.tab.json";

    // pURL = "data/qog_pp.json";   // This is Qual of Gov
}

var preprocess = {};
var mods = new Object;
console.log("Value of username: ",username);
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



// this is the function and callback routine that loads all external data: metadata (DVN's ddi), preprocessed (for plotting distributions), and zeligmodels (produced by Zelig) and initiates the data download to the server
//+++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++
//+++++++++++++++++++++++++++++++++++++++++++++++++++++
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

                      var datasetcount = d3.layout.histogram()
                      .bins(barnumber).frequency(false)
                      (myvalues);

                      // this creates an object to be pushed to allNodes. this contains all the preprocessed data we have for the variable, as well as UI data pertinent to that variable, such as setx values (if the user has selected them) and pebble coordinates
                      var obj1 = {id:i, reflexive: false, "name": valueKey[i], "labl": lablArray[i], data: [5,15,20,0,5,15,20], count: hold, "nodeCol":colors(i), "baseCol":colors(i), "strokeColor":selVarColor, "strokeWidth":"1", "subsetplot":false, "subsetrange":["", ""],"setxplot":false, "setxvals":["", ""], "grayout":false};

                      jQuery.extend(true, obj1, preprocess[valueKey[i]]);
                      allNodesColors(obj1);

                      // console.log(vars[i].childNodes[4].attributes.type.ownerElement.firstChild.data);
                      allNodes.push(obj1);

                      };

                      //console.log("allNodes: ", allNodes);
                      // Reading the zelig models and populating the model list in the right panel.
                      d3.json("data/explore.json", function(error, json) {
                              if (error) return console.warn(error);
                              var jsondata = json;

                              console.log("explore DATA json: ", jsondata);
                              for(var key in jsondata.explore) {
                              if(jsondata.explore.hasOwnProperty(key)) {
                              mods[jsondata.explore[key].name[0]] = jsondata.explore[key].description[0];
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

                                      scaffolding(callback=layout);
                                      dataDownload();
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



//searching a variable

			//scaffolding(callback=layout);
		/*
	   d3.select("#tab1").selectAll("p")
		//do something with this..

		.data(vkey)
		.enter()
		.append("p")
		.attr("id",function(d){
			  return d.replace(/\W/g, "_"); // replace non-alphanumerics for selection purposes
			  }) // perhapse ensure this id is unique by adding '_' to the front?
		.text(function(d){return d;})
		.style('background-color',function(d) {
			   if(findNodeIndex(d) > 2) {return varColor;}
			   else {return hexToRgba(selVarColor);}
			   })
    .attr("data-container", "body")
    .attr("data-toggle", "popover")
    .attr("data-trigger", "hover")
    .attr("data-placement", "right")
    .attr("data-html", "true")
    .attr("onmouseover", "$(this).popover('toggle');")
    .attr("onmouseout", "$(this).popover('toggle');")
    .attr("data-original-title", "Summary Statistics");
	*/





// scaffolding is called after all external data are guaranteed to have been read to completion. this populates the left panel with variable names, the right panel with model names, the transformation tool, an the associated mouseovers. its callback is layout(), which initializes the modeling space
function scaffolding(callback) {
	//console.log("scaffolding called");
	//console.log(valueKey);
    // establishing the transformation element
    d3.select("#transformations")
    .append("input")
    .attr("id", "tInput")
    .attr("class", "form-control")
    .attr("type", "text")
    .attr("value", "Variable transformation");

    // the variable dropdown
    d3.select("#transformations")
    .append("ul")
    .attr("id", "transSel")
    .style("display", "none")
    .style("background-color", varColor)
    .selectAll('li')
    .data(["a", "b"]) //set to variables in model space as they're added
    .enter()
    .append("li")
    .text(function(d) {return d; });

    // the function dropdown
    d3.select("#transformations")
    .append("ul")
    .attr("id", "transList")
    .style("display", "none")
    .style("background-color", varColor)
    .selectAll('li')
    .data(transformList)
    .enter()
    .append("li")
    .text(function(d) {return d; });

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
                            if(t === null) {return;}
               //        console.log(t);
                 //      console.log(t.slice(0, t.length-1));
                   //    console.log(t[t.length-1]);
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


		// populating the variable list in the left panel

		d3.select("#tab1").selectAll("p") 			//do something with this..
		.data(valueKey)
		.enter()
		.append("p")
		.attr("id",function(d){
			  return d.replace(/\W/g, "_"); // replace non-alphanumerics for selection purposes
			  }) // perhapse ensure this id is unique by adding '_' to the front?
		.text(function(d){return d;})
		.style('background-color',function(d) {
			   if(findNodeIndex(d) > 2) {return varColor;}
			   else {
                return hexToRgba(allNodes[findNodeIndex(d)].strokeColor);}
               })
    .attr("data-container", "body")
    .attr("data-toggle", "popover")
    .attr("data-trigger", "hover")
    .attr("data-placement", "right")
    .attr("data-html", "true")
    .attr("onmouseover", "$(this).popover('toggle');")
    .attr("onmouseout", "$(this).popover('toggle');")
    .attr("data-original-title", "Summary Statistics");





// populating the right panel in explore

    d3.select("#univariate")
    .style('height', 2000)
    .style('overfill', 'scroll');

    var modellist = Object.keys(mods);
//console.log("This data would be written "+  modellist);
    d3.select("#univariate").selectAll("p")
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
}
/*
$("#clearbtn").click(function() {
	$("#searchvar").val('').focus();
	restart();
	updatedata(valueKey);
	//scaffolding(callback);
	});
*/
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

	d3.select("#tab1").selectAll("p").data(valueKey).remove();


	d3.select("#tab1").selectAll("p")
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


	fakeClick();

	$("#tab1").children().popover('hide');
	populatePopover();

	addlistener(nodes);


	}


var circle = svg.append('svg:g').selectAll('g');
 var path = svg.append('svg:g').selectAll('path');


	// line displayed when dragging new nodes


	//ROHIT BHATTACHARJEE
	// mouse event vars
        var selected_node = null,
        selected_link = null,
        mousedown_link = null,
        mousedown_node = null,
        mouseup_node = null;
var force;



//kripanshu's explore work code
	  function layout(v) {


	  var myValues=[];
    nodes = [];
    links = [];

    if(v === "add" | v === "move") {
      d3.select("#tab1").selectAll("p").style('background-color',varColor);

        for(var j =0; j < zparams.zvars.length; j++ ) {
            var ii = findNodeIndex(zparams.zvars[j]);
            if(allNodes[ii].grayout) {continue;}
          nodes.push(allNodes[ii]);
            var selectMe = zparams.zvars[j].replace(/\W/g, "_");
            selectMe = "#".concat(selectMe);
            console.log(selectMe);
            d3.select(selectMe).style('background-color',function(){
                                      return hexToRgba(nodes[j].strokeColor);
                                      });

		}

        for(var j=0; j < zparams.zedges.length; j++) {
            var mysrc = nodeIndex(zparams.zedges[j][0]);
            var mytgt = nodeIndex(zparams.zedges[j][1]);
            links.push({source:nodes[mysrc], target:nodes[mytgt], left:false, right:true});
        }
        console.log("inside if,value of links:",links);
      //  tagColors(nodes, false);
      //  addlistener(nodes);
        //restart();
    }
    else {
        if(allNodes.length > 2) {
            nodes = [allNodes[0], allNodes[1], allNodes[2]];
            links = [
                {source: nodes[1], target: nodes[0], left: false, right: true },
                {source: nodes[0], target: nodes[2], left: false, right: true }
                ];
        }
        else if(allNodes.length === 2) {
            nodes = [allNodes[0], allNodes[1]];
            links = [{source: nodes[1], target: nodes[0], left: false, right: true }];
        }
        else if(allNodes.length === 1){
            nodes = [allNodes[0]];
        }
        else {
            alert("There are zero variables in the metadata.");
            return;
        }
        tagColors(nodes, false);
    }

    panelPlots(); // after nodes is populated, add subset and setx panels
    populatePopover(); // pipes in the summary stats shown on mouseovers
   // restart();



	//Rohit Bhattacharjee FORCE D3
	// init D3 force layout

		//var
		force=forced3layout(nodes, links, width, height,tick);
		// init D3 force layout
		//function forced3layout(var nodes, var links, var width, var height)
        //var force = d3.layout.force()
        //.nodes(nodes)
        //.links(links)
        //.size([width, height])
        //.linkDistance(150)
        //.charge(-800)
        //.on('tick',tick);  // .start() is important to initialize the layout


		//Rohit Bhattacharjee SVG
		//function svgappend()
		// define arrow markers for graph links
        svg.append('svg:defs').append('svg:marker')
        .attr('id', 'end-circle')
            .classed('circle_end',true)
        .attr('viewBox', '-6 -6 12 12')
        .attr('refX', 1)
            .attr('refY',1)
        .attr('markerWidth', 4)
        .attr('markerHeight', 4)
        .attr('orient', 'auto')
        .append('svg:path')
        .attr('d', 'M 0, 0  m -5, 0  a 5,5 0 1,0 10,0  a 5,5 0 1,0 -10,0')
        .style('fill', '#000');



        svg.append('svg:defs').append('svg:marker')
        .attr('id', 'start-circle')
            .classed('circle_start',true)
        .attr('viewBox', '-6 -6 12 12')
        .attr('refX', 1)
            .attr('refY',1)
        .attr('markerWidth', 4)
        .attr('markerHeight', 4)
        .attr('orient', 'auto')
        .append('svg:path')
        .attr('d', 'M 0, 0  m -5, 0  a 5,5 0 1,0 10,0  a 5,5 0 1,0 -10,0')
        .style('fill', '#000');

        // line displayed when dragging new nodes
     //   var
     drag_line = svg.append('svg:path')
        .attr('class', 'link dragline hidden')
        .attr('d', 'M0,0L0,0');

        // handles to link and node element groups
       // var
        path = svg.append('svg:g').selectAll('path');
        circle = svg.append('svg:g').selectAll('g');

        // mouse event vars
        //var
        selected_node = null,
        selected_link = null,
        mousedown_link = null,
        mousedown_node = null,
        mouseup_node = null;

        //ROHIT BHATTACHARJEE reset mouse
		//function
		 resetMouseVars(); //{
        //    mousedown_node = null;
        //    mouseup_node = null;
        //    mousedown_link = null;
        //}

		//ROHIT BHATTACHARJEE TICK
        // update force layout (called automatically each iteration)
       //function tick() {
       //    // draw directed edges with proper padding from node centers
       //    path.attr('d', function(d) {
       //              var deltaX = d.target.x - d.source.x,
       //              deltaY = d.target.y - d.source.y,
       //              dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
       //              normX = deltaX / dist,
       //              normY = deltaY / dist,
       //              sourcePadding = d.left ? allR+5 : allR,
       //              targetPadding = d.right ? allR+5 : allR,
       //              sourceX = d.source.x + (sourcePadding * normX),
       //              sourceY = d.source.y + (sourcePadding * normY),
       //              targetX = d.target.x - (targetPadding * normX),
       //              targetY = d.target.y - (targetPadding * normY);
       //              return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
       //              });
       //
       //    //  if(forcetoggle){
           circle.attr('transform', function(d) {
                       return 'translate(' + d.x + ',' + d.y + ')';
                       });


       //
       //}
       //

    //  add listeners to leftpanel.left.  every time a variable is clicked, nodes updates and background color changes.  mouseover shows summary stats or model description.
	//Rohit BHATTACHARJEE add listener
	addlistener(nodes);
   //unction addlistener(){
	//d3.select("#tab1").selectAll("p")
   //.on("mouseover", function(d) {
   //    // REMOVED THIS TOOLTIP CODE AND MADE A BOOTSTRAP POPOVER COMPONENT
   //    $("body div.popover")
   //    .addClass("variables");
   //    $("body div.popover div.popover-content")
   //    .addClass("form-horizontal");
   //     })
   //.on("mouseout", function() {
   //    //Remove the tooltip
   //    //d3.select("#tooltip").style("display", "none");
   //    })
   //.on("click", function varClick(){
   //    if(allNodes[findNodeIndex(this.id)].grayout) {return null;}
	//
   //    d3.select(this)
   //    .style('background-color',function(d) {
   //           var myText = d3.select(this).text();
   //           var myColor = d3.select(this).style('background-color');
   //           var mySC = allNodes[findNodeIndex(myText)].strokeColor;
   //
   //           zparams.zvars = []; //empty the zvars array
   //           if(d3.rgb(myColor).toString() === varColor.toString()) { // we are adding a var
   //            if(nodes.length==0) {
   //                nodes.push(findNode(myText));
   //                nodes[0].reflexive=true;
   //            }
   //            else {nodes.push(findNode(myText));}
   //            return hexToRgba(selVarColor);
   //           }
   //           else { // dropping a variable
   //
   //                nodes.splice(findNode(myText)["index"], 1);
   //                spliceLinksForNode(findNode(myText));
   //
   //            if(mySC==dvColor) {
   //                var dvIndex = zparams.zdv.indexOf(myText);
   //                if (dvIndex > -1) { zparams.zdv.splice(dvIndex, 1); }
   //                //zparams.zdv="";
   //            }
   //            else if(mySC==csColor) {
   //                var csIndex = zparams.zcross.indexOf(myText);
   //                if (csIndex > -1) { zparams.zcross.splice(csIndex, 1); }
   //            }
   //            else if(mySC==timeColor) {
   //                var timeIndex = zparams.ztime.indexOf(myText);
   //                if (timeIndex > -1) { zparams.ztime.splice(timeIndex, 1); }
   //            }
   //           else if(mySC==nomColor) {
   //                var nomIndex = zparams.znom.indexOf(myText);
   //                if (nomIndex > -1) { zparams.znom.splice(dvIndex, 1); }
   //           }
   //
   //            nodeReset(allNodes[findNodeIndex(myText)]);
   //            borderState();
   //           legend();
   //            return varColor;
   //           }
   //           });
   //    panelPlots();
   //    restart();
   //    });
	//}
	//

	//var
	drag_line = svg.append('svg:path')
        .attr('class', 'link dragline hidden')
       .attr('d', 'M0,0L0,0')
        ;



	//
    d3.select("#univariate").selectAll("p") // univariate tab
    .on("mouseover", function(d) {
        // REMOVED THIS TOOLTIP CODE AND MADE A BOOTSTRAP POPOVER COMPONENT
console.log("This model is selected")
        })
    .on("mouseout", function() {
        //Remove the tooltip
        //d3.select("#tooltip").style("display", "none");
        })
        //  d3.select("#Display_content")
        .on("click", function(){
            var myColor = d3.select(this).style('background-color');
            d3.select("#univariate").selectAll("p")
            .style('background-color',varColor);
            d3.select(this)
            .style('background-color',function(d) {
                   if(d3.rgb(myColor).toString() === varColor.toString()) {
                    zparams.zmodel = d.toString();
                    return hexToRgba(selVarColor);
                   }
                   else {
                    zparams.zmodel = "";
                    return varColor;
                   }
                   });
            restart();
            });




    // update graph (called when needed)
	//restart();
	//ROHIT BHATTACHARJEE RESTART FUNCTION
	//end restart function

    //ROHIT BHATTACHARJEE MOUSE FUNCTIONS
  // function mousedown(d) {
  //     // prevent I-bar on drag
  //     d3.event.preventDefault();
  //
  //     // because :active only works in WebKit?
  //     svg.classed('active', true);
  //
  //     if(d3.event.ctrlKey || mousedown_node || mousedown_link) {
  //         return;
  //     }
  //
  //     restart();
  // }
  //
  // function mousemove(d) {
  //     if(!mousedown_node) return;
  //
  //     // update drag line
  //     drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);
  // }
  //
  // function mouseup(d) {
  //     if(mousedown_node) {
  //         // hide drag line
  //         drag_line
  //         .classed('hidden', true)
  //         .style('marker-end', '');
  //     }
  //     // because :active only works in WebKit?
  //     svg.classed('active', false);
  //
  //     // clear mouse event vars
  //     resetMouseVars();
  // }




    // app starts here

    svg.attr('id', function(){
             return "whitespace".concat(myspace);
             })
    .attr('height', height)
    .on('mousedown', function() {
           mousedown(this);
           })
    .on('mouseup', function() {
        mouseup(this);
        });

    d3.select(window)
    .on('click',function(){  //NOTE: all clicks will bubble here unless event.stopPropagation()
        $('#transList').fadeOut(100);
        $('#transSel').fadeOut(100);
        });

    restart(); // this is the call the restart that initializes the force.layout()
    fakeClick();
} 		// end layout
//nodes
//console.log("nodes: "+nodes);




        $(document).ready(function(){

        		$("#btnSave").hide();
        });

//Rohit BHATTACHARJEE circle
//KRIPANSHU BHARGAVA  code updated for circular ends and mouseover action on link
//circle = svg.append('svg:g').selectAll('g');
function restart() {
        // nodes.id is pegged to allNodes, i.e. the order in which variables are read in
        // nodes.index is floating and depends on updates to nodes.  a variables index changes when new variables are added.
		//var force=forced3layout(nodes, links,  width,  height, tick);

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

        circle.call(force.drag);
        if(forcetoggle[0]==="true")
        {
            force.gravity(0.1);
            force.charge(-800);
            force.linkStrength(1);
          //  force.resume();

          //  circle
          //  .on('mousedown.drag', null)
          //  .on('touchstart.drag', null);
        }
        else
        {
            force.gravity(0);
            force.charge(0);
            force.linkStrength(0);
            //force.stop();
          //  force.resume();
        }
        force.resume();

        // path (link) group
        path = path.data(links);

        // update existing links
        // VJD: dashed links between pebbles are "selected". this is disabled for now
        path.classed('selected', function(d) { return;})//return d === selected_link; })
        .style('marker-start', function(d) { return d ? 'url(#start-circle)' : ''; })
        .style('marker-end', function(d) { return d ? 'url(#end-circle)' : ''; })
            .style('stroke-width',2.5)  ;


        // add new links
        path.enter().append('svg:path')
        .attr('class', 'link')
            .style('stroke-width',2.5)
        .classed('selected', function(d) { return;})//return d === selected_link; })
        .style('marker-start', function(d) { return d ? 'url(#start-circle)' : ''; })
        .style('marker-end', function(d) { return d ? 'url(#end-circle)' : ''; })
        .on('mousedown', function(d) { // do we ever need to select a link? make it delete..
            var obj1 = JSON.stringify(d);
            for(var j =0; j < links.length; j++) {
                if(obj1 === JSON.stringify(links[j])) {
                    links.splice(j,1);
                }
            }
        })

            .on('mouseover', function(d) {
                //     if(!mousedown_node || d === mousedown_node) return;
                d3.select(this)
                    .style('stroke', 'red')
                    .style("cursor", "not-allowed")
                    // Un-sets the "explicit" fill (might need to be null instead of '')
                    .classed("active", true );

              /*  div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div	.html("<span style='background-color: #d9534f ; padding:2px ; font-style: oblique' >Delete this link</span>")
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
//d3.select('#start-circle').style('fill','red');
*/


               // console.log("color is red")


            })

            .on('mouseout', function(d) {
                //    if(!mousedown_node || d === mousedown_node) return;
                // unenlarge target node
                //tooltip.style("visibility", "hidden");
                //    d3.select(this).attr('transform', '');
                d3.select(this)
                    .style('stroke', '#000')
                    .style("cursor", "pointer")
                    // Un-sets the "explicit" fill (might need to be null instead of '')
                    .classed("active", false );
              //  div.transition()
                //    .duration(500)
                  //  .style("opacity", 0);
               // console.log("color was red")


            });

 d3.select('#start-circle')
            .on('mouseover', function(d) {
                //     if(!mousedown_node || d === mousedown_node) return;
                d3.select(this)
                    .style('stroke', 'red')
                    // Un-sets the "explicit" fill (might need to be null instead of '')
                    .classed("active", true ).style('cursor','wait')
                console.log("circle color is red");


            })
            .on('mouseout', function(d) {
            //    if(!mousedown_node || d === mousedown_node) return;
            // unenlarge target node
            //tooltip.style("visibility", "hidden");
            //    d3.select(this).attr('transform', '');
            d3.select(this)
                .style('stroke', '#000')
                // Un-sets the "explicit" fill (might need to be null instead of '')
                .classed("active", true )
            console.log("circle color was red")
        });

        // remove old links
        path.exit().remove();

        // circle (node) group
       circle = circle.data(nodes, function(d) {return d.id; });


        // update existing nodes (reflexive & selected visual states)
        //d3.rgb is the function adjusting the color here.
        circle.selectAll('circle')
        .classed('reflexive', function(d) { return d.reflexive; })
        .style('fill', function(d){
               return d3.rgb(d.nodeCol);
                //return (d === selected_node) ? d3.rgb(d.nodeCol).brighter() : d3.rgb(d.nodeCol); // IF d is equal to selected_node return brighter color ELSE return normal color
               })
        .style('stroke', function(d){
               return (d3.rgb(d.strokeColor));
               })
        .style('stroke-width', function(d){
               return (d.strokeWidth);
               });

        // add new nodes

        var g = circle.enter()
        .append('svg:g')
        .attr("id", function(d) {
              var myname = d.name+"biggroup";
              return (myname);
              });

        // add plot
        g.each(function(d) {
               d3.select(this);
               if(d.plottype === "continuous") {
                densityNode(d, obj=this);
               }
               else if (d.plottype === "bar") {
                barsNode(d, obj=this);
               }
            });

        // add arc tags
        // NOTE: this block of code has been commented out to remove the "cross section" and "time series" arc tags. These tags are functioning as intended, but they do not, at present, do anything to change the statistical model or variables. To avoid confusion when using TwoRavens, they have been dropped. To add them back in, simply uncomment the block below.

        g.append("path")
        .attr("d", arc1)
        .attr("id", function(d){
              return "timeArc".concat(d.id);
              })
        .style("fill", "yellow")
        .attr("fill-opacity", 0)
        .on('mouseover', function(d){
            d3.select(this).transition()  .attr("fill-opacity", .3)
            .delay(0)
            .duration(100);   //.attr('transform', 'scale(2)');
            d3.select("#timeText".concat(d.id)).transition()
            .attr("fill-opacity", .9)
            .delay(0)
            .duration(100);
            })
        .on('mouseout', function(d){
            d3.select(this).transition()
            .attr("fill-opacity", 0)
            .delay(100)
            .duration(500);
            d3.select("#timeText".concat(d.id)).transition()
            .attr("fill-opacity", 0)
            .delay(100)
            .duration(500);
            })
        .on('click', function(d){ //this event changes the all nodes time value

            setColors(d, timeColor);

            legend(timeColor);
			if(allNodes[findNodeIndex(d.name)].time==="no"){
			if(confirm("Do you want to tag this variable as a time variable?")==true)
			{
				newallNodes=allNodes;


				allNodes[findNodeIndex(d.name)].time="yes";


				if(allNodes===newallNodes){

					$("#btnSave").show();
				}
				else
					console.log("False");

			}
			else("dont tag it");
		}
			else{

					if(confirm("This Variable is tagged as a time variable. Do you want to untag it?")==true)
			{
				newallNodes=allNodes;



				allNodes[findNodeIndex(d.name)].time="no";


				if(allNodes===newallNodes){

					$("#btnSave").show();
				}
				else
					console.log("False");

			}
			else("dont tag it");

			}

            restart();

            });
        g.append("text")
        .attr("id", function(d){
              return "timeText".concat(d.id);
              })
        .attr("x", 6)
        .attr("dy", 11.5)
        .attr("fill-opacity", 0)
        .append("textPath")
        .attr("xlink:href", function(d){
              return "#timeArc".concat(d.id);
              })
        .text("Time");


        /*
        g.append("path")
        .attr("id", function(d){
              return "csArc".concat(d.id);
              })
        .attr("d", arc2)
        .style("fill", csColor)
        .attr("fill-opacity", 0)
        .on('mouseover', function(d){
            d3.select(this).transition()
            .attr("fill-opacity", .3)
            .delay(0)
            .duration(100);
            d3.select("#csText".concat(d.id)).transition()
            .attr("fill-opacity", .9)
            .delay(0)
            .duration(100);
            })
        .on('mouseout', function(d){
            d3.select(this).transition()
            .attr("fill-opacity", 0)
            .delay(100)
            .duration(500);
            d3.select("#csText".concat(d.id)).transition()
            .attr("fill-opacity", 0)
            .delay(100)
            .duration(500);
            })
        .on('click', function(d){
            setColors(d, csColor);
            legend(csColor);
            restart();
            });
        g.append("text")
        .attr("id", function(d){
              return "csText".concat(d.id);
              })
        .attr("x", 6)
        .attr("dy", 11.5)
        .attr("fill-opacity", 0)
        .append("textPath")
        .attr("xlink:href", function(d){
              return "#csArc".concat(d.id);
              })
        .text("Cross Sec");
*/

        g.append("path")
        .attr("id", function(d){
              return "dvArc".concat(d.id);
              })
        .attr("d", arc3)
        .style("fill", dvColor)
        .attr("fill-opacity", 0)
        .on('mouseover', function(d){
            d3.select(this).transition()  .attr("fill-opacity", .3)
            .delay(0)
            .duration(100);
            d3.select("#dvText".concat(d.id)).transition()  .attr("fill-opacity", .9)
            .delay(0)
            .duration(100);
            })
        .on('mouseout', function(d){
            d3.select(this).transition()  .attr("fill-opacity", 0)
            .delay(100)
            .duration(500);
            d3.select("#dvText".concat(d.id)).transition()  .attr("fill-opacity", 0)
            .delay(100)
            .duration(500);
            })
        .on('click', function(d){
            setColors(d, dvColor);
            legend(dvColor);
            restart();
            });
        g.append("text")
        .attr("id", function(d){
              return "dvText".concat(d.id);
              })
        .attr("x", 6)
        .attr("dy", 11.5)
        .attr("fill-opacity", 0)
        .append("textPath")
        .attr("xlink:href", function(d){
              return "#dvArc".concat(d.id);
              })
        .text("Dep Var");

       g.append("path")
        .attr("id", function(d){
              return "nomArc".concat(d.id);
              })
        .attr("d", arc4)
        .style("fill", nomColor)
        .attr("fill-opacity", 0)
        .on('mouseover', function(d){
            if(d.defaultNumchar=="character") {return;}
            d3.select(this).transition()  .attr("fill-opacity", .3)
            .delay(0)
            .duration(100);
            d3.select("#nomText".concat(d.id)).transition()  .attr("fill-opacity", .9)
            .delay(0)
            .duration(100);
            })
        .on('mouseout', function(d){
            if(d.defaultNumchar=="character") {return;}
            d3.select(this).transition()  .attr("fill-opacity", 0)
            .delay(100)
            .duration(500);
            d3.select("#nomText".concat(d.id)).transition()  .attr("fill-opacity", 0)
            .delay(100)
            .duration(500);
            })
        .on('click', function(d){
            if(d.defaultNumchar=="character") {return;}
            else if(d.defaultNumchar=="numeric" && d.nature!="nominal"){
            	if(confirm("Do you want to tag this variable as a nominal?")==true)
            	{
            		setColors(d, nomColor);
            		allNodes[findNodeIndex(d.name)].nature="nominal";
            		$("#btnSave").show();


            	}
            	else("dont tag it");

            }
        	else if(d.defaultNumchar=="numeric" && d.nature=="nominal"){
				if(confirm("This variable is tagged as a nominal variable. Do you want to untag it?")==true)
            	{
            		setColors(d, nomColor);
            		allNodes[findNodeIndex(d.name)].nature="ordinal";
            		$("#btnSave").show();


            	}
            	else("dont tag it")

        	}

            legend(nomColor);
            restart();
            });
        g.append("text")
        .attr("id", function(d){
              return "nomText".concat(d.id);
              })
        .attr("x", 6)
        .attr("dy", 11.5)
        .attr("fill-opacity", 0)
        .append("textPath")
        .attr("xlink:href", function(d){
              return "#nomArc".concat(d.id);
              })
        .text("Nominal");

        g.append('svg:circle')
        .attr('class', 'node')
        .attr('r', allR)
        .style('pointer-events', 'inherit')
        .style('fill', function(d) {
         //      return (d === selected_node) ? d3.rgb(d.nodeCol).brighter().toString() : d.nodeCol; })
               return d.nodeCol; })
        .style('opacity', "0.5")
        .style('stroke', function(d) {
               return d3.rgb(d.strokeColor).toString(); })
        .classed('reflexive', function(d) { return d.reflexive; })
        .on('mouseover', function(d) {
       //     if(!mousedown_node || d === mousedown_node) return;
            })
        .on('mouseout', function(d) {
        //    if(!mousedown_node || d === mousedown_node) return;
            // unenlarge target node
            //tooltip.style("visibility", "hidden");
        //    d3.select(this).attr('transform', '');
            })
  //      .on('mousedown', function(d) {
   //         })
        .on('dblclick', function(d){
            d3.event.stopPropagation(); // stop click from bubbling
            summaryHold = true;
//            document.getElementById('transformations').setAttribute("style", "display:block");
            })
        .on('contextmenu', function(d) { // right click on node
            d3.event.preventDefault();
            d3.event.stopPropagation(); // stop right click from bubbling
            rightClickLast=true;

            mousedown_node = d;
            if(mousedown_node === selected_node) selected_node = null;
            else selected_node = mousedown_node;
            selected_link = null;

            // reposition drag line
            drag_line
            .style('marker-end', 'url(#end-circle)')
            .classed('hidden', false)
            .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);

            svg.on('mousemove', mousemove);
            restart();
            })
        .on('mouseup', function(d) {
            d3.event.stopPropagation(); // stop mouseup from bubbling

            if(rightClickLast) {
                rightClickLast=false;
                return;
            }

            if(!mousedown_node) return;

            // needed by FF
            drag_line
            .classed('hidden', true)
            .style('marker-end', '');

            // check for drag-to-self
            mouseup_node = d;
            if(mouseup_node === mousedown_node) { resetMouseVars(); return; }

            // unenlarge target node
            d3.select(this).attr('transform', '');

            // add link to graph (update if exists)
            // NB: links are strictly source < target; arrows separately specified by booleans
            var source, target, direction;
            if(mousedown_node.id < mouseup_node.id) {
            source = mousedown_node;
            target = mouseup_node;
            direction = 'right';
            } else {
            source = mouseup_node;
            target = mousedown_node;
            direction = 'left';
            }

            var link;
            link = links.filter(function(l) {
                                return (l.source === source && l.target === target);
                                })[0];
            if(link) {
            link[direction] = true;
            } else {
            link = {source: source, target: target, left: false, right: false};
            link[direction] = true;
            links.push(link);
            }

            // select new link
            selected_link = link;
            selected_node = null;
            svg.on('mousemove', null);

            resetMouseVars();
            restart();
			//forced3layout(nodes, links,  width,  height, tick);

			});


        // show node Names
        g.append('svg:text')
        .attr('x', 0)
        .attr('y', 15)
        .attr('class', 'id')
        .text(function(d) {return d.name; });


        // show summary stats on mouseover
        // SVG doesn't support text wrapping, use html instead
        g.selectAll("circle.node")
        .on("mouseover", function(d) {
            tabLeft("tab3");
            varSummary(d);
            document.getElementById('transformations').setAttribute("style", "display:block");
            var select = document.getElementById("transSel");
            select.selectedIndex = d.id;
            transformVar = valueKey[d.id];

            d3.select("#dvArc".concat(d.id)).transition()  .attr("fill-opacity", .1)
            .delay(0)
            .duration(100);
            d3.select("#dvText".concat(d.id)).transition()  .attr("fill-opacity", .5)
            .delay(0)
            .duration(100);
            if(d.defaultNumchar=="numeric") {
                d3.select("#nomArc".concat(d.id)).transition()  .attr("fill-opacity", .1)
                .delay(0)
                .duration(100);
                d3.select("#nomText".concat(d.id)).transition()  .attr("fill-opacity", .5)
                .delay(0)
                .duration(100);
            }
            d3.select("#csArc".concat(d.id)).transition()  .attr("fill-opacity", .1)
            .delay(0)
            .duration(100);
            d3.select("#csText".concat(d.id)).transition()  .attr("fill-opacity", .5)
            .delay(0)
            .duration(100);
            d3.select("#timeArc".concat(d.id)).transition()  .attr("fill-opacity", .1)
            .delay(0)
            .duration(100);
            d3.select("#timeText".concat(d.id)).transition()  .attr("fill-opacity", .5)
            .delay(0)
            .duration(100);
                })
            // popup(d, xPos, yPos);

        .on("mouseout", function(d) {
            if(summaryHold===false) { tabLeft(lefttab); }

            d3.select("#csArc".concat(d.id)).transition()
            .attr("fill-opacity", 0)
            .delay(100)
            .duration(500);
            d3.select("#csText".concat(d.id)).transition()
            .attr("fill-opacity", 0)
            .delay(100)
            .duration(500);
            d3.select("#timeArc".concat(d.id)).transition()
            .attr("fill-opacity", 0)
            .delay(100)
            .duration(500);
            d3.select("#timeText".concat(d.id)).transition()
            .attr("fill-opacity", 0)
            .delay(100)
            .duration(500);
            d3.select("#dvArc".concat(d.id)).transition()
            .attr("fill-opacity", 0)
            .delay(100)
            .duration(500);
            d3.select("#dvText".concat(d.id)).transition()
            .attr("fill-opacity", 0)
            .delay(100)
            .duration(500);
            d3.select("#nomArc".concat(d.id)).transition()
            .attr("fill-opacity", 0)
            .delay(100)
            .duration(500);
            d3.select("#nomText".concat(d.id)).transition()
            .attr("fill-opacity", 0)
            .delay(100)
            .duration(500);


            });

        // populating transformation dropdown
        var t = [];
        for(var j =0; j < nodes.length; j++ ) {
            t.push(nodes[j].name);
        }

        // the transformation variable list is silently updated as pebbles are added/removed
        d3.select("#transSel")
        .selectAll('li')
        .remove();

        d3.select("#transSel")
        .selectAll('li')
        .data(t) //set to variables in model space as they're added
        .enter()
        .append("li")
        .text(function(d) {return d; });

        $('#transSel li').click(function(event) {

                                // if 'interaction' is the selected function, don't show the function list again
                                if(selInteract === true) {
                                    var n = $('#tInput').val().concat($(this).text());
                                    $('#tInput').val(n);
                                    event.stopPropagation();
                                    var t = transParse(n=n);
                                    if(t === null) {return;}
                                    $(this).parent().fadeOut(100);
                                    transform(n=t.slice(0, t.length-1), t=t[t.length-1], typeTransform=false);
                                    return;
                                }

                                $('#tInput').val($(this).text());
                                $(this).parent().fadeOut(100);
                                $('#transList').fadeIn(100);
                                event.stopPropagation();
                                });

        // remove old nodes
        circle.exit().remove();
        force.start();
    }











//Rohit BHATTACHARJEE TICK
//KRIPANSHU BHARGAVA NODE'S END CHANGES(EXPLORE APP)
 // update force layout (called automatically each iteration)
        function tick() {
    // get mouse pointer coordinates

var Xs=0,Xt=0,Ys=0,Yt=0;
            // draw directed edges with proper padding from node centers
            path.attr('d', function(d) {
                      var deltaX = d.target.x - d.source.x,
                      deltaY = d.target.y - d.source.y,
                      dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
                      normX = deltaX / dist,
                      normY = deltaY / dist,
                      sourcePadding = d ? allR+5 : allR,
                      targetPadding = d ? allR+5 : allR,
                      sourceX = d.source.x + (sourcePadding * normX)+1,
                      sourceY = d.source.y + (sourcePadding * normY)+1,
                      targetX = d.target.x - (targetPadding * normX)+2,
                      targetY = d.target.y - (targetPadding * normY)+2;
                      return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
                      })
                .on('mouseover', function(d) {
                Xs=d.source.x;
                Xt=d.target.x;
                Ys=d.source.y;
                Yt=d.target.y;


                    d3.select(this)
                        .style('stroke', 'red')
                        .style("cursor", "not-allowed")
                        // Un-sets the "explicit" fill (might need to be null instead of '')
                        .classed("active", true );

                    /*  div.transition()
                     .duration(200)
                     .style("opacity", .9);
                     div	.html("<span style='background-color: #d9534f ; padding:2px ; font-style: oblique' >Delete this link</span>")
                     .style("left", (d3.event.pageX) + "px")
                     .style("top", (d3.event.pageY - 28) + "px");
                     //d3.select('#start-circle').style('fill','red');
                     */


                     console.log("color is red, main function")


                })

                .on('mouseout', function(d) {
                    //    if(!mousedown_node || d === mousedown_node) return;
                    // unenlarge target node
                    //tooltip.style("visibility", "hidden");
                    //    d3.select(this).attr('transform', '');
                    d3.select(this)
                        .style('stroke', '#000')
                        .style("cursor", "pointer")
                        // Un-sets the "explicit" fill (might need to be null instead of '')
                        .classed("active", false );
                    //  div.transition()
                    //    .duration(500)
                    //  .style("opacity", 0);
                     console.log("color was red")


                });




            //  if(forcetoggle){
            circle.attr('transform', function(d) {
                        return 'translate(' + d.x + ',' + d.y + ')';
                        });
            //  };



        }


	//ROHIT BHATTACHARJEE Write to JSON Function, to write new metadata file after the user has tagged a variable as a time variable
	function writetojson(btn){

		//var jsonallnodes=JSON.stringify(allNodes);

    var outtypes = [];
    for(var j=0; j < allNodes.length; j++) {
        outtypes.push({varnamesTypes:allNodes[j].name, nature:allNodes[j].nature, numchar:allNodes[j].numchar, binary:allNodes[j].binary, interval:allNodes[j].interval,time:allNodes[j].time});
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
	// $("#btnVariables").trigger("click"); // programmatic clicks
      //  $("#btnUnivariate").trigger("click");
      $('#btnSave').hide();




}

function writefail(btn)
{
	selectLadda.stop();

}

selectLadda.start();

//console.log("inside write json length:"+solajsonout.length);
makeCorsRequest(urlcall, btn, writesuccess, writefail, solajsonout);


}
//end of write to json

var drag_line = svg.append('svg:path')
      .attr('class', 'link dragline hidden')
       .attr('d', 'M0,0L0,0');

function mousedown(d) {
        // prevent I-bar on drag
        d3.event.preventDefault();

        // because :active only works in WebKit?
        svg.classed('active', true);

        if(d3.event.ctrlKey || mousedown_node || mousedown_link) {
            return;
        }

        restart();
    }

    function mousemove(d) {
        if(!mousedown_node) return;

        // update drag line
        drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);
    }

    function mouseup(d) {
        if(mousedown_node) {
            // hide drag line
            drag_line
            .classed('hidden', true)
            .style('marker-end', '');
        }
        // because :active only works in WebKit?
        //svg.classed('active', false);

        // clear mouse event vars
        resetMouseVars();
    }



		//ROHIT Bhattacharjee
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
	d3.select("#tab1").selectAll("p")
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
    zparams.znature = [];

    for(var j =0; j < nodes.length; j++ ) { //populate zvars array
        zparams.zvars.push(nodes[j].name);
        zparams.znature.push(nodes[j].nature);
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
    console.log("Estimate method called");
    if(production && zparams.zsessionid=="") {
        alert("Warning: Data download is not complete. Try again soon.");
        return;
    }

    zPop();
    // write links to file & run R CMD

    //package the output as JSON
    // add call history and package the zparams object as JSON
    zparams.callHistory=callHistory;
    var jsonout = JSON.stringify(zparams);

    //var base = rappURL+"zeligapp?solaJSON="
    urlcall = rappURL+"zeligapp"; //base.concat(jsonout);
    var solajsonout = "solaJSON="+jsonout;
    //console.log("urlcall out: ", urlcall);
    //console.log("POST out: ", solajsonout);


    zparams.allVars = valueKey.slice(10,25); // this is because the URL is too long...
    var jsonout = JSON.stringify(zparams);
    //var selectorBase = rappURL+"selectorapp?solaJSON=";
    var selectorurlcall = rappURL+"selectorapp"; //.concat(jsonout);






    function estimateSuccess(btn,json) {
        console.log("EstimateSuccess method called");
        estimateLadda.stop();  // stop spinner
        allResults.push(json);
        json_data_explore=json;
        console.log("all results"+allResults);
        //console.log("json in: ", json);
        console.log("json explore",json_data_explore );

        var myparent = document.getElementById("rightContentArea");
        if(estimated==false) {
            myparent.removeChild(document.getElementById("resultsHolder"));
        }

        estimated=true;
       // d3.select("#results")
       // .style("display", "block");
        d3.select("#result_left")
            .style("display", "block");

        d3.select("#result_right")
            .style("display", "block");

        d3.select("#resultsView")
        .style("display", "block");

        d3.select("#modelView")
        .style("display", "block");

        d3.select("#resultsView_tabular")
            .style("display", "block");

        d3.select("#resultsView_statistics")
            .style("display", "block");


        // programmatic click on Results button
        $("#btnBivariate").trigger("click");


        modelCount = modelCount+1;
        var model = "Model".concat(modelCount);

        function modCol() {
            d3.select("#modelView")
            .selectAll("p")
            .style('background-color', hexToRgba(varColor));
        }

        modCol();

        d3.select("#modelView")
        .insert("p",":first-child") // top stack for results
        .attr("id",model)
        .text(model)
        .style('background-color', hexToRgba(selVarColor))
        .on("click", function(){
            var a = this.style.backgroundColor.replace(/\s*/g, "");
            var b = hexToRgba(selVarColor).replace(/\s*/g, "");
            if(a.substr(0,17)===b.substr(0,17)) {
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
      estimated=true;
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

// This is the main function for explore app
function explore(btn) {
    console.log("Explore method called");
    if(production && zparams.zsessionid=="") {
        alert("Warning: Data download is not complete. Try again soon.");
        return;
    }
  //  console.log("Explore method called");
    zPop();
    console.log("zpop: ",zparams);
    // write links to file & run R CMD
    
    //package the output as JSON
    // add call history and package the zparams object as JSON
    zparams.callHistory=callHistory;
    var jsonout = JSON.stringify(zparams);
    
    //var base = rappURL+"zeligapp?solaJSON="
    urlcall = rappURL+"exploreapp"; //base.concat(jsonout);
    var solajsonout = "solaJSON="+jsonout;
    //console.log("urlcall out: ", urlcall);
    console.log("POST out: ", solajsonout);
    
    var jsonout = JSON.stringify(zparams);




    // explore success method
    function exploreSuccess(btn,json) {
        console.log("ExploreSuccess method called");
        estimateLadda.stop();  // stop spinner
        allResults.push(json);
      var  json_explore=json;
         console.log("the allResults is : " +allResults);
        console.log("json in: ", json);

        
       var myparent = document.getElementById("rightContentArea");
        if(estimated==false) {
            myparent.removeChild(document.getElementById("resultsHolder"));
        }

        
        estimated=true;
      //  d3.select("#results")
       // .style("display", "block");

       d3.select("#result_left")
          .style("display", "block");

        d3.select("#result_right")
            .style("display", "block");
        d3.select("#resultsView")
        .style("display", "block");

        d3.select("#modelView_Container")
        .style("display", "block");

        d3.select("#modelView")

            .style("display", "block");

        d3.select("#resultsView_tabular")
            .style("display", "block");

        d3.select("#resultsView_statistics")
            .style("display", "block");

        d3.select("#modelView")
            .style('background-color', hexToRgba(varColor))
            .style("overflow-y","hidden")
            .style("overflow-x","scroll")
            .append("span")
            .style("white-space","pre")
            .style("margin-top",0)
            .style("float","left")
            .style("position","relative")
            .style("color","#757575")
            .text("MODEL SELECTION :  ");



        // programmatic click on Results button
        $("#btnBivariate").trigger("click");

        for(var i in json_explore.images) {
            // console.log("this is data : " + i)
            var value = i;
            console.log("This is the model name : " + value);
            model_selection(value); // for entering all the variables
        }
        modelCount = modelCount+1;
        var model = "Model".concat(modelCount);
        var model_name=value;
       function modCol() {
            d3.select("#modelView")
            .selectAll("p")
                .style('background-color', "#FFD54F");
        }

        
        modCol();
        function model_selection(model_selection_name) {

            d3.select("#modelView")
                .append("span")
                .text(" | ")
                .style("margin-top",0)
                .style("float","left")
                .style("white-space","pre")
                .style("overflow-y","hidden")
                .style("overflow-x","scroll")
                .append("p", ":first-child")// top stack for results
                .attr("id", model)
                .text(model_selection_name)
                .style('background-color',"#FFD54F")
                .style("white-space","pre")
                .style("margin-top",0)
                .style("float","left")


                .on("click", function () {

                    var a = this.style.backgroundColor.replace(/\s*/g, "");
                    var b = hexToRgba(selVarColor).replace(/\s*/g, "");
                    if (a.substr(0, 17) === b.substr(0, 17)) {
                        return; //escapes the function early if the displayed model is clicked
                    }
                    viz_explore(this.id, json_explore,model_selection_name);
                    modCol();
                    d3.select(this)
                        .style('background-color',selVarColor);
                    // console.log("json explore viz first",json_explore );

                });
        }
        var rCall = [];
        rCall[0] = json.call;
        logArray.push("explore: ".concat(rCall[0]));
        showLog();
     //   console.log("json explore viz second",json_explore );
        viz_explore(model,json_explore,model_name);
    }
    
    function exploreFail(btn) {
        estimateLadda.stop();  // stop spinner
        estimated=true;
    }
    
    
    estimateLadda.start();  // start spinner
    makeCorsRequest(urlcall,btn, exploreSuccess, exploreFail, solajsonout);
    
}


function dataDownload() {
    console.log("dataDownload method called");
    zPop();
    // write links to file & run R CMD

    //package the output as JSON
    // add call history and package the zparams object as JSON
    //console.log("inside datadownload, zparams= ",zparams);
    zparams.zmetadataurl=metadataurl;
    zparams.zusername=username;
    var jsonout = JSON.stringify(zparams);
    var btn="nobutton";

    //var base = rappURL+"zeligapp?solaJSON="
    urlcall = rappURL+"dataapp"; //base.concat(jsonout);
    var solajsonout = "solaJSON="+jsonout;
    //console.log("urlcall out: ", urlcall);
   // console.log("POST out: ", solajsonout);

    function downloadSuccess(btn, json) {
        console.log("DownloadSuccess method called");
      //  json_data_explore.push(json);
        //console.log("dataDownload json in: ", json);
        console.log("json explore",json_data_explore );
        zparams.zsessionid=json.sessionid[0];

        // set the link URL
        if(production){
            var logURL=rappURL+"log_dir/log_"+zparams.zsessionid+".txt";
            document.getElementById("logID").href=logURL;
        }
        else{
            var logURL="rook/log_"+zparams.zsessionid+".txt";
            document.getElementById("logID").href=logURL;
        }

    }

    function downloadFail(btn) {
        console.log("Data have not been downloaded");
    }

    makeCorsRequest(urlcall,btn, downloadSuccess, downloadFail, solajsonout);
}



function viz(m) {
    console.log("Viz method called");
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

  /*  var resultsView_content=d3.select("#resultsView").append("svg");
    var g = resultsView_content.append("g");
    var img1=  g.append("svg:image")
        .attr("xlink:href",json.images[i])
        .attr("width", 200)
        .attr("height", 200)
    ;
    */
    for(var i in json.images) {



             var zfig = document.createElement("img");
         zfig.setAttribute("src", json.images[i]);
         zfig.setAttribute('width', 200);
         zfig.setAttribute('height', 200);



         document.getElementById("resultsView").appendChild(zfig);

d3.select("#resultView").style("background-color","#F3E5F5").style("z-index",16).style("box-shadow"," 10px 10px grey;");
    }
   // var rCall = [];
   // rCall[0] = json.call;
   // logArray.push("estimate: ".concat(rCall[0]));
   // showLog();





    for(var i=0; i <zparams.zvars.length; i++)


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



    var table = d3.select("#resultsView_tabular")
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

    d3.select("#resultsView_statistics")
    .append("p")
    .html(function() {
          return "<b>Formula: </b>".concat(json.call[0]);
          });
}



//KRIPANSHU BHARGAVA, this is viz for explore
function viz_explore(m,json_vizexplore,model_name_set) {
    //console.log("Viz explore method called: " + model_name);

    var get_data=[];
    get_data=model_name_set.split("-");
   // console.log("asdasdsdisudwiudiquwndiuawndiuawndiwudnqiuwdnaiuwndiuawndiuawndiuwnadiwd");
  //  console.log(get_data[0]+" and "+get_data[1]);

    var model_name1=get_data[0]+"-"+get_data[1];
var model_name2=get_data[1]+"-"+get_data[0];


    var mym = +m.substr(5, 5) - 1;
//console.log("mym is : "+ mym);
    function removeKids(parent) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }

    var myparent = document.getElementById("resultsView");
    removeKids(myparent);

    var json = json_vizexplore;
    //   console.log("json explore viz:"+json.toString());
    // pipe in figures to right panel
    var filelist = new Array;

    /*  var resultsView_content=d3.select("#resultsView").append("svg");
     var g = resultsView_content.append("g");
     var img1=  g.append("svg:image")
     .attr("xlink:href",json.images[i])
     .attr("width", 200)
     .attr("height", 200)
     ;
     */


    // image added to the div
    for (var i in json.images) {

if(i==model_name_set) {
    var zfig = document.createElement("img");
    zfig.setAttribute("src", json.images[i]);
    zfig.setAttribute('width', 450);
    zfig.setAttribute('height', 450);


    document.getElementById("resultsView").appendChild(zfig);

    d3.select("#resultsView").style("box-shadow","1px 1px 3px grey").style("background-color","#F5F5F5");

}
    }
    var colnames=[];
    var colvar=[];
    var table_data=[];
    var rowvar=[];
    var rownames=[];


    // data for statistics

    var cork=[];
    var corp=[];
    var cors=[];
    var var1=[];
    var var2=[];
    for(var i in json.tabular) {
        //console.log("this is data : " + i)
        if (i == model_name1 || i== model_name2) {
            for (var j in json.tabular[i].colnames) {


                console.log("colnames: ");
                console.log(json.tabular[i].colnames[j]);
                colnames.push(json.tabular[i].colnames);

            }
        }
    }


    for(var i in json.tabular) {
        console.log("rownames: ");
        if (i == model_name1 || i== model_name2) {
            for (var k in json.tabular[i].rownames) {

                console.log(json.tabular[i].rownames[k]);
                rownames.push(json.tabular[i].rownames);
            }
        }
    }
    for(var i in json.tabular) {
        if (i == model_name1 || i== model_name2) {
            for (var l in json.tabular[i].rowvar) {
                console.log("rowvar: ");
                console.log(json.tabular[i].rowvar[l]);
                rowvar.push(json.tabular[i].rowvar[l]);
            }
        }
    }
    for(var i in json.tabular) {
        if (i == model_name1 || i== model_name2) {
            for (var m in json.tabular[i].colvar) {
                console.log("colavar: ");
                console.log(json.tabular[i].colvar[m]);
                colvar.push(json.tabular[i].colvar[m]);
            }
        }
    }
  for(var i in json.tabular){
      if (i == model_name1 || i== model_name2) {
          // console.log("This is data : ");
          for (var n in json.tabular[i].data) {
table_data[n]=[];
              //  console.log(json.tabular[i].data[n]);
              console.log("this is data for : " + json.tabular[i].data[n]);
              for (var a = 0; a < colnames.length; a++) {
                 // console.log("data : ");
                 // console.log(json.tabular[i].data[n][a]);
                  table_data[n].push(json.tabular[i].data[n][a]);
              }

          }

      }
    }

    for(var p=0; p<rownames.length;p++)
    { console.log(" row data : "+ p);
        for(var l=0;l<colnames.length;l++)
        {
            console.log("col data : ");
            console.log(table_data[p][l]);
        }
    }


    // for the statistics]
    console.log("The data for the statistical"+ json.statistical)
    for(var key in json.statistical) {
      console.log(key);
        if (key == model_name1 || key== model_name2) {
            for (var a in json.statistical[key].cork) {
                console.log("cork: ");
                console.log(json.statistical[key].cork[a]);
                cork.push(json.statistical[key].cork[a]);
            }
        }
    }
    for(var key1 in json.statistical) {
        if (key1 == model_name1 || key1== model_name2) {
            for (var b in json.statistical[key1].corp) {
                console.log("corp: ");
                console.log(json.statistical[key1].corp[b]);
                corp.push(json.statistical[key1].corp[b]);
            }
        }
    }
    for(var key in json.statistical)
    {if (key == model_name1 || key== model_name2) {
        for(var c in json.statistical[key].cors)
        {
            console.log("cors: ");
            console.log(json.statistical[key].cors[c]);
            cors.push(json.statistical[key].cors[c]);
        }
    }
        }

    for(var key in json.statistical) {
        if (key == model_name1 || key== model_name2) {
            for (var d in json.statistical[key].var1) {
                console.log("var1: ");
                console.log(json.statistical[key].var1[d]);
                var1.push(json.statistical[key].var1[d]);
            }
        }
    }
    for(var key4 in json.statistical) {
        if (key == model_name1 || key== model_name2) {
            for (var e in json.statistical[key].var2) {
                console.log("var2: ");
                console.log(json.statistical[key].var2[e]);
                var2.push(json.statistical[key].var2[e]);
            }
        }
    }

    // var rCall = [];
    // rCall[0] = json.call;
    // logArray.push("estimate: ".concat(rCall[0]));
    // showLog();


    for (var i = 0; i < zparams.zvars.length; i++)


        // write the results table
         var resultsArray = [];
    for (var key in json.tabular) {
        if (key == "colnames") {
console.log("colnames found");
            continue;
        }

        var obj = json.tabular[key];
        resultsArray.push(obj);
        //console.log("This is the JSON obj : "+ obj);
        /* SO says this is important check, but I don't see how it helps here...
         for (var prop in obj) {
         // important check that this is objects own property
         // not from prototype prop inherited
         if(obj.hasOwnProperty(prop)){
         alert(prop + " = " + obj[prop]);
         }
         }  */
    }


    // table not completed yet ( 06/11/2017)
d3.select("#resultsView_tabular").html("");


    var table = d3.select("#resultsView_tabular")
        .append("p")
        //.html("<center><b>Results</b></center>")
        .append("table")
        .style("font-size",10)
        .style("line-height",10)
            .style("border","1px solid #ddd").style("text-align","left")
            .style("border-collapse","collapse")
        ;

   var thead = table.append("thead");
    thead.append("tr")
        .selectAll("th")
        .data(colnames)
        .enter()
        .append("th")
        .style("border-style","solid")
        .style("border-width",0.5)
        .style("border-left","transparent")
        .style("border-collapse","collapse")
        .style("text-align","right").style("position","relative")
        .text(function(d) { return d;});

    var tbody = table.append("tbody").style("float","left");
    tbody.selectAll("tr")
        .data(rownames)
        .enter().append("tr")
        .style("border-style","solid")
        .style("border-width",0.5).style("border-left","transparent")
        .style("text-align","right").style("position","relative")
        .selectAll("td")
        .data(function(d){return d;})
        .enter().append("td")
        .style("text-align","left").style("position","relative")
        .style("border-style","solid")
        .style("border-width",0.5)
        .style("border-right","transparent")

        .text(


            function(d){
            var myNum = Number(d);
            if(isNaN(myNum)) { return d;}
            return myNum.toPrecision(3);
        })

        .on("mouseover", function(){d3.select(this).style("background-color", "aliceblue")}) // for no discernable reason
        .on("mouseout", function(){d3.select(this).style("background-color", "#F9F9F9")}) ;  //(but maybe we'll think of one)


    // data for the statistical div
    var string1 = cork.toString();
    var string3= string1.substring(string1.indexOf(":"),string1.length);
    //  console.log(string3);
    var string2= string1.substring(0,string1.indexOf("c"));
    //  console.log(string2);
    var string4 = corp.toString();
    var string6= string4.substring(string4.indexOf(":"),string4.length);
    //  console.log(string3);
    var string5= string4.substring(0,string4.indexOf("c"));
    //  console.log(string2);
    var string7 = cors.toString();
    var string9= string7.substring(string7.indexOf(":"),string7.length);
    //  console.log(string3);
    var string8= string7.substring(0,string7.indexOf("c"));
    //  console.log(string2);
    var statistical_data= [
    { correlation : string2, value: string3},
        {correlation : string5 , value: string6},
        { correlation : string8, value: string9}
    ];

    function d3table( data){
        d3.select("#resultsView_statistics")
            .html("")
            .style("background-color","#fff")
            .append("h5")
            .text("CORRELATION STATISTICS")
            .style("color","#424242");
        var table = d3.select("#resultsView_statistics").append("table").attr("class","table").style("border-collapse"," collapse"),
            th = table.append("tr").style("border",1);

        for (var i in Object.keys(data[0])){
            th.append("td").style("border-bottom",1).style("text-align","left").style("background-color",selVarColor).append("b").text(Object.keys(data[0])[i]);
        }

        for(var row in data){
            var tr = table.append("tr").style("margin-left",40).style("border",1).style("text-align","left");
            for(var td in data[row])
                tr.append("td").style("border",1).style("text-align","left").style("position","relative").style("background-color",varColor).text(data[row][td]);
        }
    }
    d3table(statistical_data);

  /*  d3.select("resultsView_statistics").html("");
    d3.select("#resultsView_statistics")
        .html("")
        .style("background-color","#fff")
        .append("h5")
        .text("CORRELATION STATISTICS")
        .style("color","#757575")
        .append("p")
        .html(function() {

            return "<b></b>".concat(string2.concat(string3));
                        })
        .style("background-color",selVarColor)


        .append("p")

        .html(function() {
            var string1 = corp.toString();
            var string3= string1.substring(string1.indexOf(":"),string1.length);
         //   console.log(string3);
            var string2= string1.substring(0,string1.indexOf("c"));
        //    console.log(string2);
            return "<b></b>".concat(string2.concat(string3));
        })
         .style("background-color","#E1F5FE")
        .append("p")

        .html(function() {
            var string1 = cors.toString();
            var string3= string1.substring(string1.indexOf(":"),string1.length);
           // console.log(string3);
            var string2= string1.substring(0,string1.indexOf(" c"));
         //   console.log(string2);
            return "<b></b>".concat(string2.concat(string3));
        })
        .style("background-color",grayColor)
    ;
*/
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
    var transformstuff = {zdataurl:dataurl, zvars:n, zsessionid:zparams.zsessionid, transform:t, callHistory:callHistory, typeTransform:typeTransform, typeStuff:outtypes};
    var jsonout = JSON.stringify(transformstuff);
    //var base = rappURL+"transformapp?solaJSON="

    urlcall = rappURL+"transformapp"; //base.concat(jsonout);
    var solajsonout = "solaJSON="+jsonout;
    //console.log("urlcall out: ", urlcall);
    //console.log("POST out: ", solajsonout);



    function transformSuccess(btn, json) {
        estimateLadda.stop();
        json_data_explore=json;
        console.log("json explore",json_data_explore );
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

        d3.select("#tab1")
        .data(v)
        .append("p")
        .attr("id",function(){
              return v[0].replace(/\W/g, "_");
              })
        .text(v[0])
        .style('background-color', hexToRgba(selVarColor))
        .attr("data-container", "body")
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

    tabLeft('tab1');

    jQuery.fn.d3Click = function () {
        this.children().each(function (i, e) {
                    var mycol = d3.rgb(this.style.backgroundColor);
                    if(mycol.toString()===varColor.toString()) {return;}
                  var evt = document.createEvent("MouseEvents");
                  evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

                  e.dispatchEvent(evt);
                  });
    };
    $("#tab1").d3Click();
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

    if(tab!="tab3") {lefttab=tab;}
    var tabi = tab.substring(3);

    document.getElementById('tab1').style.display = 'none';
    document.getElementById('tab2').style.display = 'none';
    document.getElementById('tab3').style.display = 'none';
    document.getElementById('modelView_Container').style.display='none';

    if(tab==="tab1") {
        summaryHold = false;
        document.getElementById('btnSubset').setAttribute("class", "btn btn-default");
        document.getElementById('btnVariables').setAttribute("class", "btn active");
        document.getElementById("btnSelect").style.display = 'none';

        d3.select("#leftpanel")
        .attr("class", "sidepanel container clearfix");
    }
    else if (tab==="tab2") {
        summaryHold = false;
        document.getElementById('btnVariables').setAttribute("class", "btn btn-default");
        document.getElementById('btnSubset').setAttribute("class", "btn active");

        d3.select("#leftpanel")
        .attr("class", function(d){
              if(this.getAttribute("class")==="sidepanel container clearfix expandpanel") {
                document.getElementById("btnSelect").style.display = 'none';
                return "sidepanel container clearfix";
              }
              else {
                document.getElementById("btnSelect").style.display = 'block';
                return "sidepanel container clearfix expandpanel";
              }
              });
    }
    else {
        document.getElementById('btnSubset').setAttribute("class", "btn btn-default");
        document.getElementById('btnVariables').setAttribute("class", "btn btn-default");

        d3.select("#leftpanel")
        .attr("class", "sidepanel container clearfix");
    }

    document.getElementById(tab).style.display = 'block';
}

function tabRight(tabid) {

    document.getElementById('univariate').style.display = 'none';
    document.getElementById('setx').style.display = 'none';
  // document.getElementById('results').style.display = 'none';
   document.getElementById('result_left').style.display = 'none';
    document.getElementById('result_right').style.display = 'none';
    document.getElementById('modelView_Container').style.display='none';

    if(tabid=="btnUnivariate") {
    //  document.getElementById('btnBivariate').setAttribute("class", "btn btn-default");
     document.getElementById('btnBivariate').setAttribute("class", "btn btn-default");
      document.getElementById('btnUnivariate').setAttribute("class", "btn active");
      document.getElementById('univariate').style.display = 'block';

        d3.select("#rightpanel")
        .attr("class", "sidepanel container clearfix");
    }

    else if (tabid=="btnBivariate") {
      document.getElementById('btnUnivariate').setAttribute("class", "btn btn-default");
     // document.getElementById('btnBivariate').setAttribute("class", "btn btn-default");
      document.getElementById('btnBivariate').setAttribute("class", "btn active");
    //  document.getElementById('results').style.display = 'block';
        document.getElementById('modelView_Container').style.display='block';
        document.getElementById('result_left').style.display = 'block';
        document.getElementById('result_right').style.display = 'block';

        if(estimated===false) {
            d3.select("#rightpanel")
            .attr("class", "sidepanel container clearfix");
        }
        else if(righttab=="btnBivariate" | d3.select("#rightpanel").attr("class")=="sidepanel container clearfix") {toggleR()};
    }

    righttab=tabid; // a global that may be of use

    function toggleR() {
        d3.select("#rightpanel")
        .attr("class", function(d){
              if(this.getAttribute("class")==="sidepanel container clearfix expandpanel") {
              return "sidepanel container clearfix expandpanel";
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
    d3.select("#tab3") //tab when you mouseover a pebble
    .select("p")
    .html("<center><b>" +d.name+ "</b><br><i>" +d.labl+ "</i></center>")
    .append("table")
    .selectAll("tr")
    .data(summarydata)
    .enter().append("tr")
    .selectAll("td")
    .data(function(d){return d;})
    .enter().append("td")
    .text(function(d){return d;})
    .on("mouseover", function(){d3.select(this).style("background-color", "aliceblue")}) // for no discernable reason
    .on("mouseout", function(){d3.select(this).style("background-color", "#F9F9F9")}) ;  //(but maybe we'll think of one)
//    .style("font-size", "12px");


    var plotsvg = d3.select("#tab3")
    .selectAll("svg")
    .remove();

    if(typeof d.plottype === "undefined") { // .properties is undefined for some vars
        return;
    }
    else if (d.plottype === "continuous") {
        density(d, div="varSummary", private);
    }
    else if (d.plottype === "bar") {
        bars(d, div="varSummary", private);
    }
    else {
        var plotsvg = d3.select("#tab3")      // no graph to draw, but still need to remove previous graph
        .selectAll("svg")
        .remove();
    };

}

function populatePopover () {

    d3.select("#tab1").selectAll("p")
    .attr("data-content", function(d) {

          var onNode = findNodeIndex(d);

          return popoverContent(allNodes[onNode]);
          });
}

function popoverContent(d) {

    var rint = d3.format("r");

    var outtext = "";

    if(d.labl != "") { outtext = outtext + "<div class='form-group'><label class='col-sm-4 control-label'>Label</label><div class='col-sm-6'><p class='form-control-static'><i>" + d.labl + "</i></p></div></div>";
    }

    if (d.mean != "NA") {
      outtext = outtext + "<div class='form-group'><label class='col-sm-4 control-label'>Mean</label><div class='col-sm-6'><p class='form-control-static'>"
      if (private && d.meanCI) {
        outtext += (+d.mean).toPrecision(2).toString() + " (" + (+d.meanCI.lowerBound).toPrecision(2).toString() + " - " + (+d.meanCI.upperBound).toPrecision(2).toString() + ")"
      } else {
      outtext += (+d.mean).toPrecision(4).toString()
    }
      outtext += "</p></div></div>";
    }

    if (d.median != "NA") { outtext = outtext + "<div class='form-group'><label class='col-sm-4 control-label'>Median</label><div class='col-sm-6'><p class='form-control-static'>" + (+d.median).toPrecision(4).toString() + "</p></div></div>";
    }

    if (d.mode != "NA") { outtext = outtext + "<div class='form-group'><label class='col-sm-4 control-label'>Most Freq</label><div class='col-sm-6'><p class='form-control-static'>" + d.mode + "</p></div></div>";
    }

    if (d.freqmode != "NA") { outtext = outtext + "<div class='form-group'><label class='col-sm-4 control-label'>Occurrences</label><div class='col-sm-6'><p class='form-control-static'>" + rint(d.freqmode) + "</p></div></div>";
    }

    if (d.mid != "NA") { outtext = outtext + "<div class='form-group'><label class='col-sm-4 control-label'>Median Freq</label><div class='col-sm-6'><p class='form-control-static'>" + d.mid + "</p></div></div>";
    }

    if (d.freqmid != "NA") { outtext = outtext + "<div class='form-group'><label class='col-sm-4 control-label'>Occurrences</label><div class='col-sm-6'><p class='form-control-static'>" + rint(d.freqmid) + "</p></div></div>";
    }
    if (d.fewest != "NA") { outtext = outtext + "<div class='form-group'><label class='col-sm-4 control-label'>Least Freq</label><div class='col-sm-6'><p class='form-control-static'>" + d.fewest + "</p></div></div>";
    }

    if (d.freqfewest != "NA") { outtext = outtext + "<div class='form-group'><label class='col-sm-4 control-label'>Occurrences</label><div class='col-sm-6'><p class='form-control-static'>" + rint(d.freqfewest) + "</p></div></div>";
    }

    if (d.sd != "NA") { outtext = outtext + "<div class='form-group'><label class='col-sm-4 control-label'>Stand Dev</label><div class='col-sm-6'><p class='form-control-static'>" + (+d.sd).toPrecision(4).toString() + "</p></div></div>";
    }

    if (d.max != "NA") { outtext = outtext + "<div class='form-group'><label class='col-sm-4 control-label'>Maximum</label><div class='col-sm-6'><p class='form-control-static'>" + (+d.max).toPrecision(4).toString() + "</p></div></div>";
    }

    if (d.min != "NA") { outtext = outtext + "<div class='form-group'><label class='col-sm-4 control-label'>Minimum</label><div class='col-sm-6'><p class='form-control-static'>" + (+d.min).toPrecision(4).toString() + "</p></div></div>";
    }
    if (d.invalid != "NA") { outtext = outtext + "<div class='form-group'><label class='col-sm-4 control-label'>Invalid</label><div class='col-sm-6'><p class='form-control-static'>" + rint(d.invalid) + "</p></div></div>";
    }
    if (d.valid != "NA") { outtext = outtext + "<div class='form-group'><label class='col-sm-4 control-label'>Valid</label><div class='col-sm-6'><p class='form-control-static'>" + rint(d.valid) + "</p></div></div>" ;
    }

    if (d.uniques != "NA") { outtext = outtext + "<div class='form-group'><label class='col-sm-4 control-label'>Uniques</label><div class='col-sm-6'><p class='form-control-static'>" + rint(d.uniques) + "</p></div></div>";
    }
    if (d.herfindahl != "NA") { outtext = outtext + "<div class='form-group'><label class='col-sm-4 control-label'>Herfindahl</label><div class='col-sm-6'><p class='form-control-static'>" + (+d.herfindahl).toPrecision(4).toString() + "</p></div></div>";
    }

    return outtext;
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

        d3.select("#tab1").select("p#".concat(n.name))
        .style('background-color', hexToRgba(c));
    }
    else if (n.strokeWidth=='4') {
        if(c==n.strokeColor) { // deselecting time, cs, dv, nom
            n.strokeWidth = '1';
            n.strokeColor = selVarColor;
            n.nodeCol=colors(n.id);
            d3.select("#tab1").select("p#".concat(n.name))
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
            d3.select("#tab1").select("p#".concat(n.name))
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
    for(var j =0; j < nodes.length; j++ ) { //populate zvars and zsubset arrays
        zparams.zvars.push(nodes[j].name);
        var temp = nodes[j].id;
        zparams.zsubset[j] = allNodes[temp].subsetrange;
        if(zparams.zsubset[j].length>0) {
            if(zparams.zsubset[j][0]!="") {
                zparams.zsubset[j][0] = Number(zparams.zsubset[j][0]);
            }
            if(zparams.zsubset[j][1]!="") {
                zparams.zsubset[j][1] = Number(zparams.zsubset[j][1]);
            }
        }
        zparams.zplot.push(allNodes[temp].plottype);
        if(zparams.zsubset[j][1] != "") {subsetEmpty=false;} //only need to check one
    }

    if(subsetEmpty==true) {
        alert("Warning: No new subset selected.");
        return;
    }

    var outtypes = [];
    for(var j=0; j < allNodes.length; j++) {
        outtypes.push({varnamesTypes:allNodes[j].name, nature:allNodes[j].nature, numchar:allNodes[j].numchar, binary:allNodes[j].binary, interval:allNodes[j].interval,time:allNodes[j].time});
    }

    var subsetstuff = {zdataurl:zparams.zdataurl, zvars:zparams.zvars, zsubset:zparams.zsubset, zsessionid:zparams.zsessionid, zplot:zparams.zplot, callHistory:callHistory, typeStuff:outtypes};

    var jsonout = JSON.stringify(subsetstuff);
    //var base = rappURL+"subsetapp?solaJSON="
    urlcall = rappURL+"subsetapp"; //base.concat(jsonout);
    var solajsonout = "solaJSON="+jsonout;

    console.log("POST out: ", solajsonout);


    function subsetSelectSuccess(btn,json) {
        console.log(json);
        selectLadda.stop(); // stop motion
        $("#btnVariables").trigger("click"); // programmatic clicks
        $("#btnUnivariate").trigger("click");

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
            for(var i=0; i < v.length; i++) {
                var selectMe=v[i].replace(/\W/g, "_");
                document.getElementById(selectMe).style.color=hexToRgba(grayColor);
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
        .attr('id', function(){
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

    d3.select("#univariate").selectAll("p").style("background-color", varColor);
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

    d3.select("#univariate").selectAll("p").style("background-color", varColor);
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
