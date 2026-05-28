const fs = require('fs');
const path = require('path');

const vaultsDir = path.join(__dirname, 'src', 'app', 'app', 'vaults');
const firstVaultDir = path.join(__dirname, 'src', 'app', 'app', 'firstVault');

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      const target1 = `toast.loading("Confirmation delayed. Verifying on backend...", { id: "delayed-verification" });`;
      const replace1 = `toast.loading("Confirmation delayed. Verifying on network...", { id: "delayed-verification" });`;
      if (content.includes(target1)) {
        content = content.replace(target1, replace1);
        changed = true;
      }
      
      const target2 = `// DO NOT return here! The transaction might still be on the blockchain. Let the backend verify it.`;
      const replace2 = `// DO NOT return here! The transaction might still be on the blockchain. Let the network verify it.`;
      if (content.includes(target2)) {
        content = content.replace(target2, replace2);
        changed = true;
      }

      const target3 = `toast.success("Transaction verified. Capital allocation confirmed. Position activated.");`;
      const replace3 = `toast.success("Transaction verified. Capital allocation confirmed. Position activated.", { id: "delayed-verification" });`;
      if (content.includes(target3)) {
        content = content.replace(target3, replace3);
        changed = true;
      }

      const target4 = `setErrorMessage(err.message || "Failed to verify transaction on the backend.");`;
      const replace4 = `setErrorMessage(err.message || "Failed to verify transaction on the network.");`;
      if (content.includes(target4)) {
        content = content.replace(target4, replace4);
        changed = true;
      }

      const target5 = `toast.error(err.message || "Position activation failed.");`;
      const replace5 = `toast.error(err.message || "Position activation failed.", { id: "delayed-verification" });`;
      // wait, toast.error could be called in other places like unexpected allocation error
      // let's do a regex to replace ONLY the one after verification error
      if (changed) {
        // we'll just write it back, wait target5 is too generic.
        // Let's replace the whole block instead to be safe.
      }
      fs.writeFileSync(fullPath, content);
    }
  }
}

// Safer replacement for the whole verification block
function processDirBlock(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        processDirBlock(fullPath);
      } else if (fullPath.endsWith('.tsx')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let changed = false;
        
        // 1. delayed verification toast
        if (content.includes('Verifying on backend...')) {
          content = content.replace(/Verifying on backend\.\.\./g, 'Verifying on network...');
          changed = true;
        }
        if (content.includes('Let the backend verify it.')) {
          content = content.replace(/Let the backend verify it\./g, 'Let the network verify it.');
          changed = true;
        }
        if (content.includes('Failed to verify transaction on the backend.')) {
          content = content.replace(/Failed to verify transaction on the backend\./g, 'Failed to verify transaction on the network.');
          changed = true;
        }

        // 2. Add id: "delayed-verification" to the success toast
        const successTarget = `toast.success("Transaction verified. Capital allocation confirmed. Position activated.");`;
        const successReplace = `toast.success("Transaction verified. Capital allocation confirmed. Position activated.", { id: "delayed-verification" });`;
        if (content.includes(successTarget)) {
            content = content.replace(successTarget, successReplace);
            changed = true;
        }

        // 3. Add id: "delayed-verification" to the error toast in that block
        const errorBlockRegex = /setErrorMessage\(err\.message \|\| "Failed to verify transaction on the network\."\);\s*setDepositStep\("error"\);\s*toast\.error\(err\.message \|\| "Position activation failed\."\);/g;
        const newErrorBlock = `setErrorMessage(err.message || "Failed to verify transaction on the network.");
        setDepositStep("error");
        toast.error(err.message || "Position activation failed.", { id: "delayed-verification" });`;
        
        if (errorBlockRegex.test(content)) {
            content = content.replace(errorBlockRegex, newErrorBlock);
            changed = true;
        }
        
        if (changed) {
            fs.writeFileSync(fullPath, content);
            console.log(`Updated ${fullPath}`);
        }
      }
    }
}

processDirBlock(vaultsDir);
processDirBlock(firstVaultDir);
