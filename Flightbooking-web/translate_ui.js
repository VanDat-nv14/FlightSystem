const fs = require('fs');
const path = require('path');

const dir = './src';

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      // Translate direct value matches
      content = content.replace(/>Economy</g, '>Ph? thông<');
      content = content.replace(/>Business</g, '>Thuong gia<');
      content = content.replace(/>FirstClass</g, '>H?ng nh?t<');
      
      content = content.replace(/"Economy"/g, '"Ph? thông"'); // Be careful with this if it's used in value="..."
      // Actually, if we change the value, it breaks logic. We only want to change UI text.

      // We should look for {flight.status} and replace it with {FLIGHT_STATUS_MAP[flight.status] || flight.status}
      // Or inline mapping: {{'Scheduled':'L?ch trình','Delayed':'Tr? chuy?n','Boarding':'Ðang lên máy bay','InAir':'Ðang bay','Landed':'Ðã h? cánh','Cancelled':'Ðã h?y'}[flight.status] || flight.status}
      
      // Let's replace {t.seatClass}
      content = content.replace(/\{([a-zA-Z0-9_]+)\.seatClass\}/g, {{Economy:'Ph? thông',Business:'Thuong gia',FirstClass:'H?ng nh?t'}[.seatClass] || .seatClass});
      
      // {ticket.seatClass} -> {{Economy:'Ph? thông'...
      content = content.replace(/\{([a-zA-Z0-9_]+)\.checkInStatus\}/g, {{NotCheckedIn:'Chua Check-in',CheckedIn:'Ðã Check-in',Boarded:'Lên máy bay'}[.checkInStatus] || .checkInStatus});

      // SelectItem values:
      // <SelectItem value="Economy">Economy</SelectItem> -> <SelectItem value="Economy">Ph? thông</SelectItem>
      content = content.replace(/<SelectItem value="Economy">Economy<\/SelectItem>/g, '<SelectItem value="Economy">Ph? thông</SelectItem>');
      content = content.replace(/<SelectItem value="Business">Business<\/SelectItem>/g, '<SelectItem value="Business">Thuong gia</SelectItem>');
      content = content.replace(/<SelectItem value="FirstClass">FirstClass<\/SelectItem>/g, '<SelectItem value="FirstClass">H?ng nh?t</SelectItem>');
      
      // Admin statuses select:
      content = content.replace(/<SelectItem value="Pending">Pending<\/SelectItem>/g, '<SelectItem value="Pending">Ch? thanh toán</SelectItem>');
      content = content.replace(/<SelectItem value="Confirmed">Confirmed<\/SelectItem>/g, '<SelectItem value="Confirmed">Ðã xác nh?n</SelectItem>');
      content = content.replace(/<SelectItem value="Cancelled">Cancelled<\/SelectItem>/g, '<SelectItem value="Cancelled">Ðã h?y</SelectItem>');
      content = content.replace(/<SelectItem value="Completed">Completed<\/SelectItem>/g, '<SelectItem value="Completed">Hoàn thành</SelectItem>');

      content = content.replace(/<SelectItem value="Scheduled">Scheduled<\/SelectItem>/g, '<SelectItem value="Scheduled">L?ch trình</SelectItem>');
      content = content.replace(/<SelectItem value="Delayed">Delayed<\/SelectItem>/g, '<SelectItem value="Delayed">Hoãn</SelectItem>');
      content = content.replace(/<SelectItem value="Boarding">Boarding<\/SelectItem>/g, '<SelectItem value="Boarding">Lên máy bay</SelectItem>');
      content = content.replace(/<SelectItem value="InAir">InAir<\/SelectItem>/g, '<SelectItem value="InAir">Ðang bay</SelectItem>');
      content = content.replace(/<SelectItem value="Landed">Landed<\/SelectItem>/g, '<SelectItem value="Landed">Ðã h? cánh</SelectItem>');

      // badges or direct render
      content = content.replace(/\{([a-zA-Z0-9_]+)\.status === "Scheduled"\s*\?\s*"Scheduled"/g, '{.status === "Scheduled" ? "L?ch trình"');
      content = content.replace(/\{([a-zA-Z0-9_]+)\.status === "Delayed"\s*\?\s*"Delayed"/g, '{.status === "Delayed" ? "Hoãn"');
      
      // Replace {flight.status} directly
      // This regex replaces simple {flight.status} without breaking conditional ones
      // We will do: content = content.replace(/>\{([a-zA-Z0-9_]+)\.status\}</g, ">{{Scheduled:'L?ch trình',Delayed:'Tr? chuy?n',Boarding:'Ðang lên máy bay',InAir:'Ðang bay',Landed:'Ðã h? cánh',Cancelled:'Ðã h?y'}[.status] || .status}<");
      content = content.replace(/>\{([a-zA-Z0-9_]+)\.status\}</g, >{{Scheduled:'L?ch trình',Delayed:'Tr? chuy?n',Boarding:'Lên máy bay',InAir:'Ðang bay',Landed:'Ðã h? cánh',Cancelled:'Ðã h?y'}[.status] || .status}<);

      // {booking.bookingStatus}
      content = content.replace(/>\{([a-zA-Z0-9_]+)\.bookingStatus\}</g, >{{Pending:'Ch? TT',Confirmed:'Ðã xác nh?n',Cancelled:'Ðã h?y',Completed:'Hoàn thành'}[.bookingStatus] || .bookingStatus}<);

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated: ' + fullPath);
      }
    }
  }
}

processDirectory(dir);
