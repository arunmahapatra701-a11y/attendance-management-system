const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const backupDir = path.join(rootDir, '.backup_mobile_responsive');

const filesToRestore = [
    {
        src: path.join(backupDir, 'Navbar.jsx'),
        dest: path.join(rootDir, 'frontend', 'src', 'components', 'Navbar.jsx')
    },
    {
        src: path.join(backupDir, 'StudentDashboard.jsx'),
        dest: path.join(rootDir, 'frontend', 'src', 'pages', 'StudentDashboard.jsx')
    }
];

console.log('--- STARTING UNDO OPERATION FOR MOBILE RESPONSIVENESS CHANGES ---');

let restoredCount = 0;
for (const file of filesToRestore) {
    if (fs.existsSync(file.src)) {
        fs.copyFileSync(file.src, file.dest);
        console.log(`[RESTORED] ${file.dest}`);
        restoredCount++;
    } else {
        console.warn(`[WARNING] Backup file not found: ${file.src}`);
    }
}

if (restoredCount === filesToRestore.length) {
    console.log('SUCCESS: All files successfully reverted to their exact original state.');
} else {
    console.log(`Finished with ${restoredCount}/${filesToRestore.length} files restored.`);
}
