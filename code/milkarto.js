var worldmap;
var lastFeature = null;
var namePopup = null;
var dataPopup;

function init() {


//create vector layer
var countryLayer = new OpenLayers.Layer.Vector("GeoJSON", {
	strategies: [new OpenLayers.Strategy.Fixed()],
	protocol: new OpenLayers.Protocol.HTTP({
		url: "./data/Countries.geojson",
		format: new OpenLayers.Format.GeoJSON()
	}),
	projection: new OpenLayers.Projection("EPSG:900913"),
	isBaseLayer: true,
	styleMap: new OpenLayers.StyleMap({
		"default": new OpenLayers.Style({
			fillColor:"#CCCCCC",
			fillOpacity: 1,
			strokeColor: "#99998F",
			strokeOpacity: 0.8,
			strokeWidth: 1, 
		}),
		"hover": OpenLayers.Util.applyDefaults({
			fillColor: "#707070",
			fillOpacity: 1.0,
			strokeOpacity: 0
			}, OpenLayers.Feature.Vector.style.temporary),
		"selected": OpenLayers.Util.applyDefaults({
			fillColor: "#CC9999",
			fillOpacity: 1.0,
			strokeOpacity: 0 
		}, OpenLayers.Feature.Vector.style.temporary)
   	})
});

//create map and load layers 
	worldmap = new OpenLayers.Map({
	div: "map",
	layers: [countryLayer],
	projection: "EPSG:4326",
	resolutions:[80000,40000 ,20000, 8000 ],
	controls: [],
	center: [0, 0],
	restrictedExtent: [-20890000, -12800000, 21590000 , 19200000],
	maxExtent: [-20890000, -12800000, 21590000 , 19200000],
	zoom: 0 
});

//create highlight controler 
var highlight = new OpenLayers.Control.SelectFeature(countryLayer,{
	hover: true,
	highlightOnly: true,

	renderIntent: "hover",
	eventListeners: {
		featurehighlighted: onFeatureHighlight,
		featureunhighlighted: onFeatureUnhighlight
	}
});

//add highlight controller to map
worldmap.addControl(highlight);
highlight.handlers.feature.stopDown = false; //allow mouse paning over feature while highlighted
highlight.activate();

//create popup controler 
var clickPopup = new OpenLayers.Control.SelectFeature(countryLayer,{
	toggle: true,
	renderIntent: "selected",
	clickout: true
});

// assign events to countryLayers when selected or unselected
countryLayer.events.on({
	"featureselected": onFeatureSelect,
	"featureunselected": onFeatureUnselect
});

//add popup controller to map
worldmap.addControl(clickPopup);
clickPopup.handlers.feature.stopDown = false; //allow mouse paning over feature while highlighted
clickPopup.activate();

// detect data and display corresponding icon


// create function that creates the popup with hrefs
function onFeatureSelect(event) {
	var selectedFeature = event.feature;
	var xxyy = selectedFeature.geometry.getCentroid({weighted: true});
	var lonLat = new OpenLayers.LonLat(xxyy.x, xxyy.y);
	dataPopup = new OpenLayers.Popup.Anchored(
		"countryinfo",
		lonLat,
		new OpenLayers.Size(190,86),
 		"<div class='dp-title'>"
			+"<h1 class='dp-title'>"
				+selectedFeature.attributes.name_long  
			+"</h1>"
		+"</div>"
		+"<div class= 'dp-content'>"
			+"<div id='ico-1' class='ico-f' style='left:5px;'>"
				+"<a class='ico' href='" +selectedFeature.attributes.UNMAP_URL+ "' target='_blank'> <img src='./data/icons/uno.png'> </a>"				
			+"</div>"
			+"<div id='ico-2' class='ico-f' style='left:65px;'>"
				+"<a class='ico' href='./data/maps/"+selectedFeature.attributes.MILMAP_URL+"' target='_blank'> <img src='./data/icons/mil.png'> </a>"						
			+"</div>"
			+"<div id='ico-3'class='ico-f' style='left:125px;'>"
				+"<a class='ico' href='"+selectedFeature.attributes.CIA_URL+"' target='_blank'> <img src='./data/icons/cia.png'> </a>"						
			+"</div>"				
		+"</div>",
		null, true, function (evt) {
			clickPopup.unselect(selectedFeature);
		}
	);
	dataPopup.setOpacity('0.8');
	dataPopup.setBackgroundColor('transparent');
	selectedFeature.dataPopup = dataPopup;
	worldmap.addPopup(dataPopup);
	// replace icon when attribute is empty
	if(selectedFeature.attributes.UNMAP_URL == ""){
		var ico1 = "<div class='ico'> <img src='./data/icons/uno_bw.png'> </div>";
		document.getElementById('ico-1').innerHTML = ico1;
	}
	if(selectedFeature.attributes.MILMAP_URL == ""){
		var ico2 = "<div class='ico'> <img src='./data/icons/mil_bw.png'> </div>";
		document.getElementById('ico-2').innerHTML = ico2;
	}
	if(selectedFeature.attributes.CIA_URL == ""){
		var ico3 = "<div class='ico'> <img src='./data/icons/cia_bw.png'> </div>";
		document.getElementById('ico-3').innerHTML = ico3;
	}
	document.getElementById('countryinfo_GroupDiv').style.position = "absolute";
}

// create function to close popup
function onFeatureUnselect(event) {
	var selectedFeature = event.feature;
	worldmap.removePopup(selectedFeature.dataPopup);
	selectedFeature.dataPopup.destroy();
	selectedFeature.dataPopup = null;
}

// create popup with country names
function onFeatureHighlight(event) {
	var highlightedFeature = event.feature;
	lastFeature = highlightedFeature;
	var pixel =  new OpenLayers.Pixel(
		10,
		worldmap.getSize().h - 10
	);
	var lonLat = worldmap.getLonLatFromPixel(pixel);
	if(namePopup != null){ // if there are other tooltips active, destroy them
		worldmap.removePopup(namePopup);
		if(lastFeature != null){
			delete lastFeature.popup;
			namePopup = null;
		}
	}
	namePopup = new OpenLayers.Popup.Anchored(
		"countryname",
		lonLat,
		new OpenLayers.Size(150,30),
		"<div style='color: white; font-size: 14px;'>"
			+highlightedFeature.attributes.name_long  
		+"</div>",
		null,
		false
	);
	namePopup.autoSize = true;
	namePopup.setOpacity('0.9');
	namePopup.setBackgroundColor("#707070");
	highlightedFeature.namePopup = namePopup;
	worldmap.addPopup(namePopup);
}

// create function to close popup (countrynames)
function onFeatureUnhighlight(event) {
	var highlightedFeature = event.feature;
	worldmap.removePopup(highlightedFeature.namePopup);
	highlightedFeature.namePopup.destroy();
	delete highlightedFeature.namePopup;
	highlightedFeature.namePopup = null;
	lastFeature = null;
}

// add navigation contols on top of the map
worldmap.addControls([
	new OpenLayers.Control.Navigation({
			dragPanOptions: {enableKinetic: true},
			handleRightClicks: true
	})
]);


}
