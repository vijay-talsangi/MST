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

function runPrims() {
    let selectedNodes = new Set();
    let mstEdges = [];
    let totalCost = 0;
    infoBox.html("");

    selectedNodes.add(startNode);
    console.log("Starting Prim's Algorithm from:", startNode);

    while (selectedNodes.size < houses.length) {
        let minEdge = null;

        edges.forEach(edge => {
            let inTree = selectedNodes.has(edge.source) ^ selectedNodes.has(edge.target);
            if (inTree) {
                if (!minEdge || edge.weight < minEdge.weight) {
                    minEdge = edge;
                }
            }
        });

        if (minEdge) {
            mstEdges.push(minEdge);
            selectedNodes.add(minEdge.source);
            selectedNodes.add(minEdge.target);
            totalCost += minEdge.weight;
        }
    }

    // Animate MST edges
    mstEdges.forEach((edge, index) => {
        setTimeout(() => {
            const edgeClass = `.edge-${edge.source}-${edge.target}`;

            svg.selectAll(edgeClass)
                .transition()
                .duration(800)
                .style("stroke", "yellow")
                .style("stroke-width", 6);

            infoBox.append("p")
                .text(`Edge selected: (${edge.source} - ${edge.target}), Cost: ${edge.weight}`)
                .style("color", "blue")
                .style("font-weight", "bold");

            if (index === mstEdges.length - 1) {
                setTimeout(() => {
                    infoBox.append("p")
                        .text(`Total MST Cost: ${totalCost}`)
                        .style("color", "red")
                        .style("font-size", "18px")
                        .style("font-weight", "bold");
                }, index * 1200);
            }
        }, index * 1200);
    });
}

function resetGraph() {
    d3.selectAll(".edge")
        .transition()
        .duration(500)
        .style("stroke", "gray")
        .style("stroke-width", 2);

    d3.selectAll(".node").attr("opacity", 1);
    infoBox.html("");
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
    let house = { x: x, y: y, id: houses.length };
    houses.push(house);

    svg.append("image")
        .attr("x", x - 15)
        .attr("y", y - 15)
        .attr("width", 30)
        .attr("height", 30)
        .attr("href", "h.png")
        .attr("class", "node") // Use same class as initial nodes
        .attr("data-id", house.id)
        .style("cursor", "pointer")
        .on("dblclick", function(event, d) {
            startNode = house.id;
            d3.selectAll(".node").attr("opacity", 1);
            d3.select(this).attr("opacity", 0.5);
            console.log("Selected start node:", startNode);
        });

    console.log("House added:", house);
    // Reapply event listeners to include the new node
    setupNodeClickListeners();
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

function createEdge(house1Id, house2Id) {
    house1Id = parseInt(house1Id);
    house2Id = parseInt(house2Id);
     // Prevent self-edges
     if (house1Id === house2Id) {
        selectedHouse = null;
        svg.selectAll(".node").style("stroke", "none");
        return;
    }
    let house1 = houses.find(h => h.id === house1Id);
    let house2 = houses.find(h => h.id === house2Id);

    if (!house1 || !house2) {
        alert("Invalid houses selected!");
        return;
    }

    let weight = prompt("Enter edge weight:", "5");
    if (weight === null || isNaN(weight)) return;
    weight = parseInt(weight);

    edges.push({ source: house1Id, target: house2Id, weight: weight });

    // Draw edge
    svg.insert("line", ":first-child")
        .attr("class", `edge edge-${house1Id}-${house2Id} edge-${house2Id}-${house1Id}`)
        .attr("x1", house1.x)
        .attr("y1", house1.y)
        .attr("x2", house2.x)
        .attr("y2", house2.y)
        .style("stroke", "gray")
        .style("stroke-width", 2);

    // Add weight label
    svg.insert("text", ":first-child")
        .attr("class", "weight")
        .attr("x", (house1.x + house2.x) / 2)
        .attr("y", (house1.y + house2.y) / 2 - 5)
        .attr("fill", "black")
        .attr("font-size", "14px")
        .text(weight);
}

document.getElementById("runButton").addEventListener("click", runPrims);
document.getElementById("resetButton").addEventListener("click", resetGraph);