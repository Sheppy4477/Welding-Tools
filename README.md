# Weld Tools

Open `index.html` in a web browser. No installation, server, or internet connection is needed for calculations.

Use **Geometry & weight** in the navigation, or open `geometry.html`, for material and weld cross-sectional area, volume, weight, and combined assembly totals. Supports multiple rectangular, round, or tubular material groups; fillets; single bevel grooves; and symmetric single U grooves. Both groove profiles support land or no land. U grooves use circular root corners tangent to straight upper walls, with explicit radius and included-angle inputs. The page includes formulas and a proportional joint preview.

The **Symmetric V groove (WEL410)** profile matches the inputs and formulas from `WEL410_Bevel_Weight_Calculator.xlsx`, tabs **Bevel 1 - Mild Steel** and **Bevel 2 - Titanium**. The two example buttons load the worksheet inputs. This model fixes the number of equal plates at two, takes each plate's width and thickness, uses the weld length as plate length, and shares one density between parent and weld metal. Total included angle is split equally. Bevel cutouts are subtracted from gross plate area, cap width is the top opening, and root reinforcement width is the root gap. No cap overlap or additional penetration allowance is included. Land may range from zero through full thickness. Single-bevel and U-groove profiles retain their separate geometry assumptions.

Workbook examples (lb per joint): mild steel material **11.969109**, weld **1.376734**, total **13.345842**; titanium material **2.840194**, weld **0.178912**, total **3.019106**. Automated tests reconcile the source workbook's detailed geometry, area, volume, and weight results and test changes to land, density, and length.

Cap reinforcement height and root reinforcement height replace the old extra weld metal percentage on both calculator pages. Each reinforcement area is `(width × height) / 2`, represented as a triangular crown. Cap width comes from the joint face (fillet hypotenuse or groove mouth); custom production profiles use an entered cap width. Enter the root bead width for root reinforcement. Fillet cap height is perpendicular to the sloped face; fillets have no root reinforcement. Reinforcement increases weld volume and weight without changing the groove cutout. Existing saved estimates default the new heights to zero; old percentage values are ignored.

Select whether material dimensions are before preparation or already net. Before preparation subtracts the ideal groove cutout before adding deposited weld metal. Automatic subtraction requires a common material density; for mixed materials enter prepared net pieces. Summed material cross-section and gross exterior surface area are reported separately. Land remains parent material. Saved geometry inputs are independent of the production estimate.

Click **Open physical breakdown ↗** on the geometry page to open a separate window with a dimensioned cross-section, a schematic extrusion along the weld length, and step-by-step formulas with the current dimensions substituted. It updates automatically while the calculator stays open, includes material and combined-weight calculations, and can be printed. Allow pop-ups for the site if your browser blocks the window. Open it from the calculator; visiting `breakdown.html` directly displays instructions until linked to a calculator.

Enter geometry and stock for one finished unit, then set the batch quantity. Travel and wire feed speeds use inches per minute (IPM); weight uses pounds and prices use USD. Default density is an editable 0.283 lb/in³ steel estimate.

The calculator includes fillet, single V groove, and custom weld areas; plate, round bar, tube, and custom stock volumes; solid-wire deposition from feed speed; direct deposition-rate entry; measured bead travel speed; entered or measured operator factor; labor, overhead, filler, stock, and arc-consumable costs.

Use direct deposition-rate entry for cored wire and stick electrodes. The solid-wire formula assumes a solid circular wire. Effective fill travel is a joint completion rate; multipass bead travel requires the measured-speed mode and a pass count.

Save inputs stores the current estimate in this browser. Print estimate opens the browser print dialog, which can also save a PDF. Reset example restores example inputs; press Save inputs to persist the reset.

Expand Calculation methods & assumptions in the program for formulas, scope, and references. Operator factor covers production delays; additional setup is entered separately. Avoid counting the same setup time in both values.
