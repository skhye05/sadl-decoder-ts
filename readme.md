---
runme:
  id: 01HNN1WQ3GYRWZN5BG5XG896RT
  version: v2.2
---

#Usage

```typescript {"id":"01HNN1ZD4AGYQAS3EP018MG5XB"}
import { DriverLicenseService } from "./sadl";

...

const sampleData = "....";
const service = new DriverLicenseService();
const data = service.decode(sampleData, "hex");
console.log(data);
```