const width = 800, height = 600;

const nodes = [
    { id: 0, x: 100, y: 200 },
    { id: 1, x: 300, y: 100 },
    { id: 2, x: 500, y: 300 },
    { id: 3, x: 700, y: 200 },
    { id: 4, x: 400, y: 500 }
];

const edges = [
    { source: 0, target: 1, weight: 4 },
    { source: 0, target: 2, weight: 8 },
    { source: 1, target: 2, weight: 3 },
    { source: 1, target: 3, weight: 7 },
    { source: 2, target: 3, weight: 2 },
    { source: 2, target: 4, weight: 5 },
    { source: 3, target: 4, weight: 6 }
];

const svg = d3.select("svg");

let startNode = 0;

// Draw roads (edges)
const link = svg.selectAll(".edge")
    .data(edges)
    .enter().append("line")
    .attr("class", d => `edge edge-${d.source}-${d.target} edge-${d.target}-${d.source}`)
    .attr("x1", d => nodes[d.source].x)
    .attr("y1", d => nodes[d.source].y)
    .attr("x2", d => nodes[d.target].x)
    .attr("y2", d => nodes[d.target].y)
    .style("stroke", "gray")
    .style("stroke-width", 2);

// Add edge weights
svg.selectAll(".weight")
    .data(edges)
    .enter().append("text")
    .attr("class", "weight")
    .attr("x", d => (nodes[d.source].x + nodes[d.target].x) / 2)
    .attr("y", d => (nodes[d.source].y + nodes[d.target].y) / 2 - 5)
    .attr("fill", "black")
    .attr("font-size", "14px")
    .text(d => d.weight);

    let clickTimeout = null;
// Add houses (nodes) with data-id
svg.selectAll(".node")
    .data(nodes)
    .enter().append("image")
    .attr("xlink:href", "h.png")
    .attr("x", d => d.x - 15)
    .attr("y", d => d.y - 15)
    .attr("width", 30)
    .attr("height", 30)
    .attr("class", "node")
    .attr("data-id", d => d.id) // Add data-id
    .on("click", function(event, d) {
        // Handle single click after delay
        clickTimeout = setTimeout(() => {
            handleNodeClick(d.id);
        }, 300);
    })
    .on("dblclick", function(event, d) {
        // Clear the pending single click
        clearTimeout(clickTimeout);
        // Handle double click
        startNode = d.id;
        d3.selectAll(".node").attr("opacity", 1);
        d3.select(this).attr("opacity", 0.5);
        console.log("Selected start node:", startNode);
    });

// Create a display for selected edges and cost
const infoBox = d3.select("#infoBox");
let totalCost = 0;

let isPrimsRunning = false;
let selectedNodes = new Set();
let currentCandidates = [];
let mstEdges = [];
let minEdge = null;

function runPrims() {
    if (isPrimsRunning) return;
    
    isPrimsRunning = true;
    selectedNodes.clear();
    mstEdges = [];
    totalCost = 0;
    infoBox.html("");
    
    selectedNodes.add(startNode);
    currentCandidates = getCandidateEdges();
    minEdge = findMinEdge(currentCandidates);
    
    updateCandidateEdgesHighlight();
    infoBox.append("p").text("Click on what you think is the next minimum edge!");
}

function getCandidateEdges() {
    return edges.filter(edge => {
        const hasSource = selectedNodes.has(edge.source);
        const hasTarget = selectedNodes.has(edge.target);
        return (hasSource && !hasTarget) || (!hasSource && hasTarget);
    });
}

function findMinEdge(edgeList) {
    if (edgeList.length === 0) return null;
    return edgeList.reduce((min, e) => e.weight < min.weight ? e : min, edgeList[0]);
}

function updateCandidateEdgesHighlight() {
    d3.selectAll(".edge")
        .style("stroke", "gray")
        .style("stroke-width", 2);
    
    currentCandidates.forEach(edge => {
        d3.selectAll(`.edge-${edge.source}-${edge.target}`)
            .style("stroke", "blue")
            .style("stroke-width", 6)
            .style("cursor", "pointer")
    .on("click", function(event, d) {
        handleEdgeClick(d);
    });;
    });
}

function handleEdgeClick(clickedEdge) {
    if (!isPrimsRunning) return;

    // Check if the edge is already part of MST
    if (mstEdges.some(e => (e.source === clickedEdge.source && e.target === clickedEdge.target) || 
                            (e.source === clickedEdge.target && e.target === clickedEdge.source))) {
        infoBox.append("p").text("This edge is already part of the MST. Try another one!");
        return;
    }
    
    const isCandidate = currentCandidates.some(e => 
        (e.source === clickedEdge.source && e.target === clickedEdge.target) ||
        (e.source === clickedEdge.target && e.target === clickedEdge.source)
    );
    
    if (!isCandidate) {
        // Highlight incorrect choice
        d3.selectAll(`.edge-${clickedEdge.source}-${clickedEdge.target}`)
            .transition()
            .style("stroke", "red")
            .style("stroke-width", 4)
            .transition()
            .duration(1000)
            .style("stroke", "gray")
            .style("stroke-width", 2);
        
        infoBox.append("p").text("❌ Incorrect! This edge doesn’t connect to a new node. Try again!");
        return;
    }

    if (clickedEdge.weight === minEdge.weight) {
        addEdgeToMST(clickedEdge);
    } else {
        // Incorrect choice, highlight in red
        d3.selectAll(`.edge-${clickedEdge.source}-${clickedEdge.target}`)
            .transition()
            .style("stroke", "red")
            .style("stroke-width", 4)
            .transition()
            .duration(1000)
            .style("stroke", "blue")
            .style("stroke-width", 6)
            .style("cursor", "pointer")
    .on("click", function(event, d) {
        handleEdgeClick(d);
    });;

        infoBox.append("p").text("❌ Incorrect! Try again or request a hint.");
    }
}

function addEdgeToMST(edge) {
    d3.selectAll(`.edge-${edge.source}-${edge.target}`)
        .transition()
        .style("stroke", "green")
        .style("stroke-width", 6);

    mstEdges.push(edge);
    totalCost += edge.weight;
    selectedNodes.add(edge.source);
    selectedNodes.add(edge.target);
    
    infoBox.append("p").html(`✅ Correct! Added edge <strong>${edge.source}-${edge.target}</strong> (weight: ${edge.weight})`);

    currentCandidates = getCandidateEdges();
    
    if (currentCandidates.length === 0) {
        setTimeout(() => {
            infoBox.append("p").html(`🎉 MST Complete! Total cost: <strong>${totalCost}</strong>`);
            isPrimsRunning = false;
        }, 1000);
    } else {
        minEdge = findMinEdge(currentCandidates);
        updateCandidateEdgesHighlight();
        infoBox.append("p").text("Great! Now choose the next minimum edge.");
    }
}

function showHint() {
    if (!isPrimsRunning || !minEdge) return;
    
    d3.selectAll(`.edge-${minEdge.source}-${minEdge.target}`)
        .transition()
        .style("stroke", "orange")
        .style("stroke-width", 6)
        .transition()
        .duration(1500)  // Extended delay for better visibility
        .style("stroke", "green")
        .style("stroke-width", 6);

    infoBox.append("p").text("Here's the correct edge. Watch and learn!");
    setTimeout(() => addEdgeToMST(minEdge), 2000);
}

// Attach event listeners to edges
const edgeGroup = svg.selectAll(".edge-group")
    .data(edges)
    .enter()
    .append("g")
    .attr("class", "edge-group");

// Invisible, thick line for better click detection
edgeGroup.append("line")
    .attr("class", d => `edge-clickable edge-${d.source}-${d.target} edge-${d.target}-${d.source}`)
    .attr("x1", d => nodes[d.source].x)
    .attr("y1", d => nodes[d.source].y)
    .attr("x2", d => nodes[d.target].x)
    .attr("y2", d => nodes[d.target].y)
    .style("stroke", "transparent")
    .style("stroke-width", 10)  // Make it wide but invisible
    .style("cursor", "pointer")
    .on("click", function(event, d) {
        handleEdgeClick(d);
    });

// Visible edge (actual road)
edgeGroup.append("line")
    .attr("class", d => `edge edge-${d.source}-${d.target} edge-${d.target}-${d.source}`)
    .attr("x1", d => nodes[d.source].x)
    .attr("y1", d => nodes[d.source].y)
    .attr("x2", d => nodes[d.target].x)
    .attr("y2", d => nodes[d.target].y)
    .style("stroke", "gray")
    .style("stroke-width", 2);


// Add hint button event
document.getElementById("hintButton").addEventListener("click", showHint);

// Reset function
function resetGraph() {
    isPrimsRunning = false;
    selectedNodes.clear();
    mstEdges = [];
    totalCost = 0;
    minEdge = null;
    currentCandidates = [];

    // Reset all edges to default state
    d3.selectAll(".edge")
        .transition()
        .duration(500)
        .style("stroke", "gray")
        .style("stroke-width", 2)
        .style("cursor", "pointer");

    // Reset invisible clickable edges
    d3.selectAll(".edge-clickable")
        .transition()
        .duration(500)
        .style("stroke", "transparent")
        .style("stroke-width", 10);

    // Reset all nodes
    d3.selectAll(".node")
        .attr("opacity", 1)
        .style("stroke", "none");

    // Reset edge weights
    d3.selectAll(".weight")
        .transition()
        .duration(500)
        .attr("fill", "black")
        .attr("font-size", "14px");

    // Clear dynamically added houses and edge 
    

    // Clear info box messages
    infoBox.html("");

    console.log("Graph fully reset.");
}





let houses = [...nodes];
let nedges = [];
let selectedHouse = null;

document.getElementById('addHouseButton').addEventListener('click', function() {
    svg.on("click", function(event) {
        let coords = d3.pointer(event);
        addHouse(coords[0], coords[1]);
        svg.on("click", null); // Remove the listener after adding
    });
});

function addHouse(x, y) {
    let house = { x: x, y: y, id: nodes.length }; // Add to nodes array
    nodes.push(house);

    svg.append("image")
        .attr("x", x - 15)
        .attr("y", y - 15)
        .attr("width", 30)
        .attr("height", 30)
        .attr("href", "h.png")
        .attr("class", "node")
        .attr("data-id", house.id)
        .style("cursor", "pointer")
        .on("dblclick", function(event) {
            startNode = house.id;
            d3.selectAll(".node").attr("opacity", 1);
            d3.select(this).attr("opacity", 0.5);
            console.log("Selected start node:", startNode);
        });

    console.log("House added:", house);
    setupNodeClickListeners();
}

function createEdge(house1Id, house2Id) {
    if (house1Id === house2Id) {
        selectedHouse = null;
        svg.selectAll(".node").style("stroke", "none");
        return;
    }

    let house1 = nodes.find(h => h.id === house1Id);
    let house2 = nodes.find(h => h.id === house2Id);

    if (!house1 || !house2) {
        alert("Invalid houses selected!");
        return;
    }

    let weight = prompt("Enter edge weight:", "5");
    if (weight === null || isNaN(weight)) return;
    weight = parseInt(weight);

    const newEdge = { source: house1Id, target: house2Id, weight: weight };
    edges.push(newEdge); // Add to edges array

    // Draw edge WITH DATA BINDING
    svg.insert("line", ":first-child")
        .datum(newEdge) // Attach edge data to the DOM element
        .attr("class", `edge edge-${house1Id}-${house2Id} edge-${house2Id}-${house1Id}`)
        .attr("x1", house1.x)
        .attr("y1", house1.y)
        .attr("x2", house2.x)
        .attr("y2", house2.y)
        .style("stroke", "gray")
        .style("stroke-width", 2)
        .on("click", function(event, d) { handleEdgeClick(d); }); // Now 'd' is defined

    // Add weight label WITH DATA BINDING
    svg.insert("text", ":first-child")
        .datum(newEdge) // Attach edge data
        .attr("class", "weight")
        .attr("x", (house1.x + house2.x) / 2)
        .attr("y", (house1.y + house2.y) / 2 - 5)
        .attr("fill", "black")
        .attr("font-size", "14px")
        .text(weight);

    // Add clickable transparent overlay
    svg.insert("line", ":first-child")
        .datum(newEdge)
        .attr("class", `edge-clickable edge-${house1Id}-${house2Id} edge-${house2Id}-${house1Id}`)
        .attr("x1", house1.x)
        .attr("y1", house1.y)
        .attr("x2", house2.x)
        .attr("y2", house2.y)
        .style("stroke", "transparent")
        .style("stroke-width", 10)
        .style("cursor", "pointer")
        .on("click", function(event, d) { handleEdgeClick(d); });
}

// Event delegation for edge creation
function setupNodeClickListeners() {
    svg.selectAll(".node").on("click", function(event) {
        let clickedHouse = d3.select(this);
        let houseId = parseInt(clickedHouse.attr("data-id"));
        console.log(houseId);
        if (selectedHouse === null) {
            selectedHouse = houseId;
            clickedHouse.style("stroke", "red");
        } else {
            createEdge(selectedHouse, houseId);
            selectedHouse = null;
            svg.selectAll(".node").style("stroke", "none");
        }
    });
}
// Initial setup of event listeners
setupNodeClickListeners();

// function createEdge(house1Id, house2Id) {
//     house1Id = parseInt(house1Id);
//     house2Id = parseInt(house2Id);
//      // Prevent self-edges
//      if (house1Id === house2Id) {
//         selectedHouse = null;
//         svg.selectAll(".node").style("stroke", "none");
//         return;
//     }
//     let house1 = houses.find(h => h.id === house1Id);
//     let house2 = houses.find(h => h.id === house2Id);

//     if (!house1 || !house2) {
//         alert("Invalid houses selected!");
//         return;
//     }

//     let weight = prompt("Enter edge weight:", "5");
//     if (weight === null || isNaN(weight)) return;
//     weight = parseInt(weight);

//     edges.push({ source: house1Id, target: house2Id, weight: weight });

//     // Draw edge
//     svg.insert("line", ":first-child")
//         .attr("class", `edge edge-${house1Id}-${house2Id} edge-${house2Id}-${house1Id}`)
//         .attr("x1", house1.x)
//         .attr("y1", house1.y)
//         .attr("x2", house2.x)
//         .attr("y2", house2.y)
//         .style("stroke", "gray")
//         .style("stroke-width", 2);

//     // Add weight label
//     svg.insert("text", ":first-child")
//         .attr("class", "weight")
//         .attr("x", (house1.x + house2.x) / 2)
//         .attr("y", (house1.y + house2.y) / 2 - 5)
//         .attr("fill", "black")
//         .attr("font-size", "14px")
//         .text(weight);
// }

document.getElementById("runButton").addEventListener("click", runPrims);
document.getElementById("resetButton").addEventListener("click", resetGraph);