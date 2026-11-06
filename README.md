# Weld Tools

Open `index.html` in a web browser. No installation, server, or internet connection is needed for calculations.

**Production & cost** calculates weld and stock weights, deposition from solid wire feed or a known rate, travel speed in inches per minute, operator factor, production time, and costs per pound, finished unit, and batch. Enter supplier or measured deposition data for cored wire and stick electrodes.

**Geometry & weight** calculates material and weld cross-sectional area, volume, weight, and combined assembly totals. Supports symmetric V grooves, single bevel grooves, fillets, and symmetric U grooves. Groove profiles support land or no land. The page includes an inline joint preview and formula notes.

The symmetric V groove model fixes the number of equal plates at two. Enter plate thickness, width per plate, weld/plate length, total included angle, root gap, cap and root reinforcement heights, land, and density. Each plate uses half the included angle. Beveled material is subtracted before calculating material area and weight. Cap width is the top groove opening; root reinforcement width is the root gap. Plate and weld metal share one density. No cap overlap or additional penetration allowance is included.

Single-bevel and U-groove profiles use independent stock inputs. U grooves use circular root corners tangent to straight upper walls, with explicit root radius and included angle. Choose whether stock dimensions are before preparation or already net. Before preparation subtracts the ideal groove cutout before adding deposited weld metal; automatic subtraction requires a common material density. Enter prepared net pieces for mixed materials. Material cross-section and gross exterior surface area are reported separately. Land remains parent material.

Cap and root reinforcement each use area = (width × height) / 2. Cap width comes from the joint face; custom production profiles use an entered width. Fillet cap height is perpendicular to the sloped face; fillets have no root reinforcement. Reinforcement increases weld volume and weight without changing the groove cutout.

Save inputs stores the current inputs in this browser. The two calculator pages save independently. Print opens the browser print dialog, which can also save a PDF. Reset inputs restores the starting inputs; save afterward to keep the reset. New geometry calculations start with blank primary dimensions. Existing saved inputs remain available.

Expand the formula notes for calculation assumptions. Operator factor covers production delays; additional setup is entered separately. Avoid counting the same setup time in both values.

Run `node geometry.test.cjs` to check geometry, reinforcement, material/assembly mass balance, input validation, and reference calculations.
