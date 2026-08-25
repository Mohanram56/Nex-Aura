const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const srcDir = path.join(__dirname, '..', 'src');
console.log('Replacing layout elements and formatters in src directory:', srcDir);

const replacements = [
  // Hydration formatting fixes
  { from: /toLocaleDateString\(undefined/g, to: 'toLocaleDateString("en-US"' },
  { from: /toLocaleDateString\(\[\]/g, to: 'toLocaleDateString("en-US"' },
  { from: /toLocaleTimeString\(\[\]/g, to: 'toLocaleTimeString("en-US"' },
  
  // Heading color fixes
  { from: /text-white">Attendance Activity Heatmap/g, to: 'text-slate-100">Attendance Activity Heatmap' },
  { from: /text-white">Timesheet Log/g, to: 'text-slate-100">Timesheet Log' },
  { from: /text-white leading-tight">/g, to: 'text-slate-100 leading-tight">' },
  { from: /text-white font-bold text-lg">{g.progress}%/g, to: 'text-slate-100 font-bold text-lg">{g.progress}%' },
  { from: /text-white mb-1">Time Recorder/g, to: 'text-slate-100 mb-1">Time Recorder' },
  { from: /text-white">Apply for Leave/g, to: 'text-slate-100">Apply for Leave' },
  { from: /text-white">Leave History/g, to: 'text-slate-100">Leave History' },
  { from: /text-white flex items-center gap-2">Active Goals/g, to: 'text-slate-100 flex items-center gap-2">Active Goals' },
  { from: /text-white flex items-center gap-2">Review Timeline/g, to: 'text-slate-100 flex items-center gap-2">Review Timeline' },
  { from: /text-xl font-bold text-white leading-tight">\{activeTask.title\}/g, to: 'text-xl font-bold text-slate-100 leading-tight">{activeTask.title}' },
  { from: /text-white text-lg mb-1">Queue Completed/g, to: 'text-slate-100 text-lg mb-1">Queue Completed' },
  { from: /text-3xl font-extrabold text-white">\{totalTeam\}/g, to: 'text-3xl font-extrabold text-slate-100">{totalTeam}' },
  { from: /text-white flex items-center gap-2">Managed Team/g, to: 'text-slate-100 flex items-center gap-2">Managed Team' },
  { from: /text-white flex items-center gap-2">Pending Approvals/g, to: 'text-slate-100 flex items-center gap-2">Pending Approvals' },
  { from: /text-white flex items-center gap-2 font-bold/g, to: 'text-slate-100 flex items-center gap-2 font-bold' },
  { from: /text-white">Weekly Shift Planner/g, to: 'text-slate-100">Weekly Shift Planner' },
  { from: /text-white">Workload Balance Index/g, to: 'text-slate-100">Workload Balance Index' },
  { from: /text-white text-base">\{project.name\} Sprint/g, to: 'text-slate-100 text-base">{project.name} Sprint' },
  { from: /text-white">Gantt Timeline Chart/g, to: 'text-slate-100">Gantt Timeline Chart' },
  { from: /text-white">\{title\}/g, to: 'text-slate-100">{title}' },

  // Form input text color fixes (preventing white text inside white text boxes in light mode)
  { from: /text-white outline-none focus:border-indigo-500/g, to: 'text-slate-100 outline-none focus:border-indigo-500' },
  { from: /text-white placeholder-slate-550 outline-none/g, to: 'text-slate-100 placeholder-slate-550 outline-none' },
  { from: /text-white placeholder-slate-600 outline-none/g, to: 'text-slate-100 placeholder-slate-600 outline-none' },
  { from: /text-white placeholder-slate-650 outline-none/g, to: 'text-slate-100 placeholder-slate-650 outline-none' }
];

walkDir(srcDir, (filePath) => {
  if (filePath.endsWith('.tsx') && !filePath.includes('login') && !filePath.includes('unauthorized')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    replacements.forEach(rep => {
      content = content.replace(rep.from, rep.to);
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Updated: ${filePath}`);
    }
  }
});

console.log('Replacements completed successfully!');
