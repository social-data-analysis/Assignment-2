//----------------------------------------------------------------------------------------------------------------------
// HISTOGRAM
//----------------------------------------------------------------------------------------------------------------------

// Define SVG dimensions.
var histogramWidth = 1100,
    histogramHeight = 220;

var padding = 40;

var parseDate = d3.timeParse("%m/%d/%Y");
var formatDate = d3.timeFormat("%m/%d/%Y");

var minDate = 2006,
    maxDate = 2016;

var tickValues = d3.range(12);

var colors = ["#8C5B79", "#777DA3", "#49A1B4", "#41BFA4", "#88D57F", "#E2E062"]; 

// Create SVG element
var svgHistogram = d3.select(".histogram").append("svg")
  .attr("width", histogramWidth)
  .attr("height", histogramHeight);


Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

function getDates(startDate, stopDate) {
  var dateArray = new Array();
  var currentDate = startDate;
  while (currentDate <= stopDate) {
      dateArray.push(formatDate(new Date (currentDate)));
      currentDate = currentDate.addDays(1);
  }
  return dateArray;
}

d3.csv("./allMurders.csv", function(data) {
  
  var allDays = getDates(new Date("2006-01-01"), new Date("2016-01-01")); // get all days between 2006-2016

  var nestedData = d3.nest()
    .key(function(d) {
      return d.RPT_DT;
    })
    .entries(data);

  // Add the days that are missing from the dataset and set their murder count to 0
  allDays.map(function(day) {
    if (!nestedData.includes(day)) {
      nestedData.push({
        key: day,
        values: []
      })
    }
  })
  
  createBins(nestedData);
});

function createBins(data) {

  // Count up murders each day
  var processedData = [];

  data.map(function (item) {
    processedData.push({
      day: item.key,
      murderCount: item.values.length 
    })
  })
  
  createBarPlot(processedData);
}

function createBarPlot(data) {
  
  // Get max value for y scale
  var maxHRange = Math.max.apply(Math, data.map(function(d) { return d.murderCount; }))

  // Set the ranges
  xScale = d3.scaleTime()
    .domain([new Date(2006, 0, 1), new Date(2016, 0, 1)])
    .rangeRound([padding, histogramWidth - padding]);

  xAxis = d3.axisBottom()
    .scale(xScale);

  yScale = d3.scaleLinear()
    .domain([0, maxHRange])
    .range([histogramHeight - padding, padding]);

  yAxis = d3.axisLeft()
    .scale(yScale)
    .ticks(10);
  
  createRectangles(data);
}

function createRectangles(data) { 
  svgHistogram.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", function(d) {
      return xScale(parseDate(d.day));
    })
    .attr("y", function(d) {
      return yScale(d.murderCount);
    })
    .attr("width", 0.8)
    .attr("height", function(d) {
      return histogramHeight - padding - yScale(d.murderCount);
    })
    .attr('fill', colors[2]);

  svgHistogram.append("g")
    .attr("class", "axisX")
    .attr("transform", "translate(0," + (histogramHeight - padding) + ")")
    .call(xAxis);

  svgHistogram.append("g")
    .attr("class", "axisY")
    .attr("transform", "translate(" + padding + ",0)")
    .call(yAxis);

  svgHistogram.append("text")
    .attr("transform", "translate(" + (histogramWidth / 2) + "," + (histogramHeight - 2) + ")")
    .style("text-anchor", "middle")
    .style("font-size", "15px")
    .text("Day");

  svgHistogram.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0)
    .attr("x", 0 - (histogramHeight / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "15px")
    .text("Nr of murders");
}

//----------------------------------------------------------------------------------------------------------------------
// NYC MAP
//----------------------------------------------------------------------------------------------------------------------

var w = 600,
    h = 600;

var color = ["#8C5B79", "#777DA3", "#49A1B4", "#41BFA4", "#88D57F", "#E2E062"];

var svg = d3.select("body").select(".map").append("svg")
  .attr("width", w)
  .attr("height", h);

var projection = d3.geoMercator()
  .scale([50000])
  .center([-73.94, 40.70])
  .translate([w / 2, h / 2])

var path = d3.geoPath().projection(projection);

d3.json("boroughs.geojson", function(json) {
  svg.selectAll("path")
     .data(json.features)
     .enter()
     .append("path")
     .attr("d", path)
     .style("fill", function(d, i) {
       return color[i]
     })
     .style("z-index", 1);

     d3.csv("murders.csv", function(data) {
        svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function(d) {
          return projection([d.Longitude, d.Latitude])[0];
        })
        .attr("cy", function(d) {
          return projection([d.Longitude, d.Latitude])[1];
        })
        .attr("r", 2)
        .attr("class", "non_brushed")
        .style("z-index", 3)
     });
});