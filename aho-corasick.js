const fs = require('fs');
const path = require('path');
const readline = require('readline');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');


const directoryPath = 'C:/Hype/frontend'; 
// const directoryPath = './files'; 
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.question('Enter the directory path to search in: ', (directoryPath) => {
    if (!fs.existsSync(directoryPath)) {
        console.warn(`Directory "${directoryPath}" does not exist. Please check the path.`);
        rl.close();
        return;
    }

    // Step 2: Ask user for the file containing keywords
    rl.question('Enter the path to the file containing keywords: ', (keywordsFilePath) => {
        if (!fs.existsSync(keywordsFilePath)) {
            console.warn(`File "${keywordsFilePath}" does not exist. Please check the path.`);
            rl.close();
            return;
        }

        // Read keywords from file
        const keywords = fs.readFileSync(keywordsFilePath, 'utf-8')
        .split(/\r?\n/)  // Split by new lines
        .filter(keyword => keyword.length > 0); 

        if (keywords.length === 0) {
            console.warn("No keywords found in the file. Exiting...");
            rl.close();
            return;
        }

        console.log(`Loaded ${keywords.length} keywords from file.`);

        // Step 3: Ask user for the search string (must be from keywords)
        rl.question(`Enter a search keyword (must be from the list): `, (searchKeyword) => {
            console.log(":- keywords",keywords,"searchKeyword",searchKeyword)
            if (!keywords.includes(searchKeyword)) {
                console.warn(`"${searchKeyword}" is not in the keyword list. Please enter a valid keyword.`);
                rl.close();
                return;
            }

            console.log(`🔍 Searching for "${searchKeyword}" in files...`);

            searchPatternsInFiles(directoryPath, keywords, searchKeyword);
            rl.close();
        });
    });
});


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
    buildFailureFunction() {
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

    search(text, callback) {
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

function searchPatternsInFiles(directoryPath, keywords, searchKeyword) {
    const ahoCorasick = new AhoCorasick();
    console.log("keywords",keywords)
    // Add keywords to the Trie
    keywords.forEach(keyword => ahoCorasick.makeTheTrie(keyword, keyword));
    ahoCorasick.buildFailureFunction();

    function processSearch(content, fileName) {
        console.log(`\n🔎 Searching in file: ${fileName}`);

        const occurrences = {};
        ahoCorasick.search(content, (index, pattern) => {
            if (!occurrences[pattern]) occurrences[pattern] = [];
            occurrences[pattern].push(index);
        });

        console.log(":- occurrences",occurrences)

        // Only display results for the user-selected keyword
        if (occurrences[searchKeyword]) {
            console.log(`✅ Pattern "${searchKeyword}" found ${occurrences[searchKeyword].length} time(s) at positions: ${occurrences[searchKeyword].join(', ')}`);
        } else {
            console.log("❌ No matches found.");
        }
    }

    function traverseDirectory(currentPath) {
        const items = fs.readdirSync(currentPath);

        items.forEach(item => {
            const itemPath = path.join(currentPath, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                traverseDirectory(itemPath);
            } else if (stats.isFile()) {
                const textFileExtensions = ['.txt'];

                if (textFileExtensions.some(ext => item.endsWith(ext))) {
                    const content = fs.readFileSync(itemPath, 'utf-8');
                    processSearch(content, itemPath);
                }
            }
        });
    }

    traverseDirectory(directoryPath);
}




