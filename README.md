# Weld Tools

Open `index.html` in a web browser. No installation, server, or internet connection is needed for calculations.

**Production & cost** calculates weld and stock weights, deposition from solid wire feed or a known rate, travel speed in inches per minute, operator factor, production time, and costs per pound, finished unit, and batch. Enter supplier or measured deposition data for cored wire and stick electrodes.

**Geometry & weight** opens with an editable steel bevel example and calculates material and weld cross-sectional area, volume, weight, and combined assembly totals. The material box shows gross stock, preparation deductions, and net material in area/volume/weight columns. A separate weld box shows total weld cross-section, volume, and weight, with optional area components. Supports symmetric V grooves, single bevel grooves, fillets, and symmetric U grooves. Groove profiles support land or no land. The page includes an inline joint preview and formula notes. If stock lengths differ from weld length, net area is left unavailable while volume and weight deductions remain calculated.

The symmetric V groove model fixes the number of equal plates at two. Enter plate thickness, width per plate, weld/plate length, total included angle, root gap, cap and root reinforcement heights, land, and densities. Each plate uses half the included angle. Beveled material is subtracted before calculating material area and weight. Cap width is the top groove opening; root reinforcement width is the root gap. Material and weld densities can be overridden independently. No cap overlap or additional penetration allowance is included.

Both pages have quick density buttons for steel (0.283), aluminum (0.098), titanium (0.163), and stainless steel (0.289), in lb/in³. Buttons update densities only; dimensions stay as entered. All density fields remain editable. Geometry buttons fill weld, material, and current stock-piece densities. Production buttons fill weld, stock, and filler densities. A custom edit clears the matching reference highlight without overwriting the custom value. Save inputs preserves the numeric density overrides.

These are approximate references, with steel retaining the existing nominal value. Alloy references: [6061 aluminum, NIST](https://materialsdata.nist.gov/bitstream/handle/11115/179/Properties%2Bof%2BWrought%2BAluminum.pdf?sequence=3), [Grade 2 titanium, Rolled Alloys](https://www.rolledalloys.com/wp-content/uploads/TiGrade2_DS_USA.pdf), and [304 stainless steel, MatWeb](https://matweb.com/search/DataSheet.aspx?MatGUID=072da6c8d36c4c519a87c9b082c58cd3). Actual density varies by alloy.

All profiles keep material inputs inside **Weld geometry**. Symmetric V grooves use the shared plate dimensions; fillet, single-bevel, and U-groove profiles show material piece dimensions directly below the weld inputs in the same section. Multiple pieces and stock shapes remain available. U grooves use circular root corners tangent to straight upper walls, with explicit root radius and included angle. Choose whether stock dimensions are before preparation or already net. Before preparation subtracts the ideal groove cutout before adding deposited weld metal; automatic subtraction requires a common material density. Enter prepared net pieces for mixed materials. Material cross-section and gross exterior surface area are reported separately. Land remains parent material.

Cap and root reinforcement each use area = (width × height) / 2. Cap width comes from the joint face; custom production profiles use an entered width. Fillet cap height is perpendicular to the sloped face; fillets have no root reinforcement. Reinforcement increases weld volume and weight without changing the groove cutout.

Save inputs stores the current inputs in this browser. The two calculator pages save independently. Geometry always opens with the example; use Load saved inputs to retrieve your saved work, or Load example to restore the startup example. Production restores its saved inputs automatically and provides Reset inputs. Print opens the browser print dialog, which can also save a PDF.

Expand the formula notes for calculation assumptions. Operator factor covers production delays; additional setup is entered separately. Avoid counting the same setup time in both values.

Run `node geometry.test.cjs` to check geometry, reinforcement, material/assembly mass balance, input validation, and reference calculations.
