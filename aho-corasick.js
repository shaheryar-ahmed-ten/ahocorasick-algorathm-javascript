const fs = require('fs');
const path = require('path');
const readline = require('readline');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');


// const directoryPath = 'C:/Hype/frontend'; 
const directoryPath = './files'; 

const rl = readline.createInterface({
        input: process.stdin,
    output: process.stdout
    });

rl.question("Enter the directory path to search files: ",(directoryPath) => {
    if(!fs.existsSync(directoryPath)){
        console.log(`Directory "${directoryPath}" does not exist. Please check the path.`)
        rl.close();
        return;
    }

    rl.question('Enter patterns to search (separate with commas): ', (input) => {
        const patterns = input.split(',').map(pattern => pattern.trim()).filter(Boolean);
    
        if (patterns.length === 0) {
            console.log('⚠️ No patterns provided. Exiting...');
            rl.close();
            return;
        }
    
        if (!fs.existsSync(directoryPath)) {
            console.warn(`Directory "${directoryPath}" does not exist. Please check the path.`);
            rl.close();
            return;
        }
    
        searchPatternsInFiles(directoryPath, patterns);
        // results.forEach((value) => {
        //     console.log(`${value}`);
        // });
        rl.close();
    });
})


class AhoCorasikNode {
    constructor() {
        this.children = {};
        this.output = [];
        this.failure = null;
    }
}

class AhoCorasick {
    constructor() {
        this.root = new AhoCorasikNode();
    }

    // makeTheTrie(pattern, output) {
    //     let node = this.root;

    //     for (const char of pattern) {
    //         if (!node.children[char]) {
    //             this.root.children[char] = new AhoCorasikNode();
    //             node = this.root
    //         }
    //     }

    //     node.output.push(output);  
    // }

    makeTheTrie(pattern, output) {
        let node = this.root;

        for (const char of pattern) {
            if (!node.children[char]) {
                node.children[char] = new AhoCorasikNode();
            }
            node = node.children[char];
        }

        node.output.push(output);  // Add pattern to output at the final node
    }

    //This function handles suffix links
    makeSuffixLinks() {
        const queue = [];

        // Set failure links for immediate children of the root
        for (const child in this.root.children) {
            this.root.children[child].failure = this.root;
            queue.push(this.root.children[child]);
        }

        while (queue.length > 0) {
            const currentNode = queue.shift();

    for (const key in currentNode.children) {

        // const child = currentNode.children
        // currentNode.children = currentNode.children[key]
        // queue.push(currentNode.children)
        // console.log("queue",queue)
        // console.log("currentNode.children[key]", currentNode.children[key])
        
        const child = currentNode.children[key];
        queue.push(child);

        let failureNode = currentNode.failure;

        // yahan pr greatest suffix prefix maloom krna hai
                while (failureNode !== null && !failureNode.children[key]) {
                            failureNode = failureNode.failure;
                                 }

        child.failure = failureNode ? failureNode.children[key] : this.root;
        // console.log(child.failure)
        // failure links se iska output link update krna hai
    child.output = child.output.concat(child.failure.output);
    }
        }
    }

    findInTrie(text, callback) {
        let currentNode = this.root;

for (let i = 0; i < text.length; i++) {
            const char = text[i];

            // Follow failure links if no child matches the character
            while (currentNode !== null && !currentNode.children[char]) {
                currentNode = currentNode.failure;
            }

                    currentNode = currentNode ? currentNode.children[char] : this.root;

            // Call the callback for each matched pattern
            for (const output of currentNode.output) {
                callback(i - output.length + 1, output);
            }
        }
                }
}
// const results = []

function searchPatternsInFiles(directoryPath, patterns) {
    const ahoCorasick = new AhoCorasick();

    // Add patterns to the automaton
    patterns.forEach(pattern => ahoCorasick.makeTheTrie(pattern, pattern));
    ahoCorasick.makeSuffixLinks();

    function processSearch(content, fileName) {
        // console.log(`\n🔎 Searching in file: ${fileName}`);

        const occurrences = {};
        ahoCorasick.findInTrie(content, (index, pattern) => {
            if (!occurrences[pattern]) occurrences[pattern] = [];
            occurrences[pattern].push(index);
        });

        if (Object.keys(occurrences).length === 0) {
            // console.log("❌ No patterns found.");
        } else {
            for (const [pattern, positions] of Object.entries(occurrences)) {
                // results.push(`✅ file: ${fileName}:Pattern "${pattern}" found ${positions.length} time(s) at positions: ${positions.join(', ')}`)
                console.log(`✅ file: ${fileName}:Pattern "${pattern}" found ${positions.length} time(s) at positions: ${positions.join(', ')}`);
            }
        }
    }

    function traverseDirectory(currentPath) {
        const items = fs.readdirSync(currentPath);

        items.forEach(item => {
            const itemPath = path.join(currentPath, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                // Recursively process subdirectories
                traverseDirectory(itemPath);
            } else if (stats.isFile()) {

                if (item.endsWith('.txt')) {
                    const content = fs.readFileSync(itemPath, 'utf-8');
                    processSearch(content, itemPath);
                } 
            }
        });
    }

    // Start recursive traversal from the root directory
    traverseDirectory(directoryPath);
}



