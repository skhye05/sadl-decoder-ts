#Usage

```typescript
import { DriverLicenseService } from "./sadl";

...

const sampleData = "....";
const service = new DriverLicenseService();
const data = service.decode(sampleData, "hex");
console.log(data);
```
