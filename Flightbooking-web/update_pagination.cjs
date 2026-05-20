const fs = require('fs');
const path = require('path');

const dirAdmin = path.join(__dirname, 'src', 'pages', 'admin');
const dirCustomer = path.join(__dirname, 'src', 'pages', 'customer');

const filesToUpdate = [
    path.join(dirAdmin, 'FlightsPage.tsx'),
    path.join(dirAdmin, 'BookingsPage.tsx'),
    path.join(dirAdmin, 'RoutesPage.tsx'),
    path.join(dirAdmin, 'AirportsPage.tsx'),
    path.join(dirAdmin, 'AircraftsPage.tsx'),
    path.join(dirAdmin, 'UsersPage.tsx'),
    path.join(dirAdmin, 'AirlinesManagementPage.tsx'),
    path.join(dirCustomer, 'FlightListPage.tsx'),
];

const importStatement = `import { PaginationControl } from "@/components/ui/pagination-control"`;

const replaceBlock = (content, currentPageVar) => {
    // We are looking for the <div className="flex items-center gap-2"> that contains "Trang trước" and "Trang sau"
    // Since it spans multiple lines, we can use a regex to match it.
    
    // The regex needs to match:
    // <div className="flex items-center gap-2">
    // ...
    // Trang sau
    // </Button>
    // </div>
    
    // We can also just replace the whole totalPages > 1 block for admin pages.
    // For admin pages it looks like:
    /*
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 bg-card p-3 rounded-lg border shadow-sm">
          <div className="text-sm text-muted-foreground">
            Hiển thị <span className="font-medium text-foreground">{...}</span> trên tổng số <span className="font-medium text-foreground">{...}</span> ...
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Trang trước</Button>
            <div className="flex items-center gap-1 px-2 text-sm font-medium">Trang {currentPage} / {totalPages}</div>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Trang sau</Button>
          </div>
        </div>
      )}
    */

    let newContent = content;

    // Pattern for admin pages (and some customer) with standard formatting
    const adminPattern1 = /<div className="flex items-center gap-2">[\s\S]*?Trang trước[\s\S]*?Trang {([a-zA-Z0-9_]+)} \/ {([a-zA-Z0-9_]+)}[\s\S]*?Trang sau[\s\S]*?<\/div>/g;
    
    // For BookingsPage and FlightsPage that might have different spacing
    newContent = newContent.replace(adminPattern1, (match, p1, p2) => {
        let setPageStr = 'setCurrentPage';
        if (p1 === 'currentPageOutbound') setPageStr = 'setCurrentPageOutbound';
        if (p1 === 'currentPageReturn') setPageStr = 'setCurrentPageReturn';
        return `<PaginationControl currentPage={${p1}} totalPages={${p2}} onPageChange={${setPageStr}} />`;
    });

    // We should also ensure the import is present
    if (!newContent.includes('PaginationControl')) {
        return content; // No change
    }

    if (!newContent.includes(importStatement)) {
        // Insert after last import
        const lines = newContent.split('\n');
        let lastImportIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ')) {
                lastImportIndex = i;
            }
        }
        if (lastImportIndex !== -1) {
            lines.splice(lastImportIndex + 1, 0, importStatement);
            newContent = lines.join('\n');
        }
    }

    return newContent;
};

for (const file of filesToUpdate) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        let newContent = replaceBlock(content);
        if (content !== newContent) {
            fs.writeFileSync(file, newContent, 'utf8');
            console.log(`Updated ${file}`);
        } else {
            console.log(`No changes made to ${file}`);
        }
    } else {
        console.log(`File not found: ${file}`);
    }
}
