# 01 — DESIGN NORTH STAR
Redesign Rideclub as a spatial motorcycle operating system rather than a conventional mobile SaaS application.
Use the supplied HMI reference image as the visual inspiration for cockpit composition, information hierarchy, and instrument-panel density.
Do not copy the reference branding, logos, vehicle identity, exact artwork, or proprietary visual assets.
Preserve Rideclub's own product identity, motorcycle-community purpose, route intelligence, and social riding features.
The interface must feel like an OEM-grade digital cockpit rather than a generic glassmorphism dashboard.
The map remains the primary spatial surface on navigation-heavy screens.
Information should float around the map instead of being forced into conventional rounded cards.
Use instrument clusters, telemetry, radial controls, route spines, edge labels, command docks, and spatial overlays.
Reduce card usage by at least seventy percent compared with the current design.
Never create a page whose visual structure is simply a grid of rounded cards.
Treat every UI element as either navigation, telemetry, control, signal, or spatial context.
Use visual hierarchy before container hierarchy.
Use whitespace and negative space to separate information before using borders.
Use thin technical lines as a primary structural primitive.
Use circular and radial geometry for controls and measurements.
Use horizontal instrument bands for persistent status.
Use vertical route spines for sequential ride information.
Use nodes and connection lines for rider-network visualization.
Use subtle glow only to communicate state, not as decoration everywhere.
The final product should feel premium, restrained, technical, human, and motorcycle-oriented.
# 02 — REFERENCE IMAGE ANALYSIS
Use the uploaded 2047 by 1535 reference as a composition reference.
The reference establishes a large digital instrument panel mounted inside a dark physical environment.
The reference uses a split cockpit composition with instrument data on the left and navigation on the right.
The reference uses a dark near-black environment surrounding the primary interface.
The reference uses a deep navy-black instrument surface rather than pure flat black everywhere.
The reference uses a large central numeric speed readout as a visual anchor.
The reference uses a circular gauge around the primary speed value.
The reference uses a vehicle visualization below the speed gauge.
The reference uses route navigation as the dominant right-side spatial surface.
The reference uses a compact turn instruction overlay at the upper-left of the map.
The reference uses a strong route line with a high-contrast active state.
The reference uses small system indicators along the upper edge.
The reference uses a media control band below the navigation map.
The reference uses a bottom command strip for persistent vehicle controls.
Translate these principles into a motorcycle-first Rideclub interface.
Replace car-specific controls with motorcycle controls and riding intelligence.
Replace car speedometer semantics with motorcycle telemetry semantics.
Replace climate controls with ride controls, communication, navigation, and group controls.
Preserve the reference's calm density rather than reproducing every visual detail.
Use the reference as an HMI composition benchmark, not as a literal copy.
# 03 — BRAND EXPERIENCE
Rideclub should communicate freedom, precision, movement, community, and exploration.
The brand should feel adventurous without looking like a gaming interface.
The brand should feel futuristic without becoming cyberpunk.
The brand should feel technical without becoming industrial or sterile.
The brand should feel premium without relying on excessive gradients.
The brand should feel social without turning into a conventional social-media feed.
The brand should feel safe and trustworthy during active riding.
The interface should remain legible in low-light riding conditions.
The interface should prioritize glanceable information over reading-heavy content.
The interface should distinguish critical information from secondary information immediately.
Use motion to communicate system state and movement.
Use sound-ready visual states even if audio is not implemented.
Use physical-control metaphors sparingly and consistently.
Make Rideclub recognizable from the silhouette of its cockpit layout.
Make the map and rider network visually ownable.
Make the Ride action the central product action.
Make group cohesion a distinctive Rideclub concept.
Make route intelligence more prominent than generic trip metadata.
Make rider identity feel like an instrument profile rather than a social profile.
Avoid copying common navigation-app visual conventions unless they improve safety.
# 04 — INFORMATION ARCHITECTURE
Primary navigation contains Home, Navigation, Ride, Groups, and Profile.
Ride is the primary creation and activation action.
Home provides the rider's current spatial state and quick actions.
Navigation provides active route guidance and route intelligence.
Ride provides ride creation, ride preparation, active ride, and ride summary states.
Groups provides nearby rides, communities, group discovery, and rider networks.
Profile provides rider identity, statistics, routes, achievements, and preferences.
Admin functions remain separate from the rider cockpit experience.
Do not expose administrative controls inside active riding surfaces.
Use context-sensitive commands rather than exposing every action at once.
Prioritize the current task over navigation chrome.
Collapse secondary controls when the rider enters active navigation.
Expand contextual controls when the rider stops or opens a planning state.
Use a consistent command dock across major screens.
Use a consistent telemetry vocabulary across the entire application.
Use consistent icon semantics across all screens.
Use consistent active-state animation across all spatial surfaces.
Use consistent route color semantics across planning and active riding.
Use consistent rider state semantics across group screens.
Use consistent alert severity semantics across the application.
# 05 — LAYOUT GRID
Build the design system around a twelve-column spatial grid.
Use an eight-pixel base spacing unit for standard UI geometry.
Use four-pixel increments for micro-spacing.
Use sixteen-pixel increments for major spacing.
Use twenty-four-pixel increments for section separation.
Use thirty-two-pixel increments for cockpit-level separation.
Use forty-eight-pixel minimum touch targets.
Use sixty-four-pixel command zones for primary controls where appropriate.
Maintain a minimum safe visual margin around map interaction areas.
Respect device safe areas on modern mobile devices.
Respect landscape cockpit layouts with asymmetric information zones.
Allow the map to occupy the largest uninterrupted region possible.
Use edge rails for persistent telemetry.
Use a top status rail for system state.
Use a bottom command rail for navigation and core actions.
Use floating overlays only when they are contextually necessary.
Avoid equal-width card grids.
Avoid excessive symmetric panels when asymmetry improves spatial comprehension.
Use intentional asymmetry inspired by real cockpit layouts.
Make the active route the visual axis of the screen.
# 06 — COLOR SYSTEM
Primary background is #050607.
Secondary background is #090C10.
Cockpit surface is #0D1118.
Elevated instrument surface is #131823.
Deep navy surface is #151A28.
Primary text is near-white #F4F7FA.
Secondary text is #AAB1BD.
Muted text is #66707D.
Primary Rideclub accent is #FF4D21.
Accent should be used for primary actions and critical active states.
Navigation route may use a high-visibility cyan-green or electric green state.
Do not use orange as the route line if it reduces route readability.
Live communication state uses cyan.
Success state uses electric green.
Warning state uses amber.
Critical state uses red.
Informational state uses blue.
Disabled state uses neutral gray.
Do not rely on color alone to communicate state.
Pair state color with icons, labels, motion, or shape.
# 07 — TYPOGRAPHY
Use a clean geometric sans-serif for primary interface typography.
Use a technical monospaced font for telemetry and system values.
Use large numeric typography for speed, distance, ETA, and group statistics.
Use medium-weight uppercase labels for telemetry captions.
Use sentence case for user-facing instructional content.
Avoid making every piece of text uppercase.
Use tabular numerals for changing metrics.
Use tight tracking for large numeric values.
Use slightly expanded tracking for tiny telemetry labels.
Maintain strong contrast between numeric values and labels.
Do not use decorative futuristic fonts for body content.
Use typography to establish hierarchy before adding containers.
Primary speed value should be visually dominant on active cockpit screens.
Distance and ETA should have secondary but prominent hierarchy.
Rider names should remain human and readable.
Route names should use normal readable capitalization.
System labels can use uppercase technical treatment.
Use consistent decimal precision across telemetry.
Do not show unnecessary decimals while riding.
Format distance and speed according to user locale and preference.
# 08 — ICONOGRAPHY
Use a consistent stroke-based icon family.
Lucide icons may remain the base icon system.
Custom motorcycle icons may be introduced where generic icons are insufficient.
Use filled states only for strong active-state emphasis.
Do not mix unrelated icon styles.
Use icon containers sparingly.
Prefer icon plus micro-label for unfamiliar actions.
Use directional arrows for navigation instructions.
Use rider nodes for people rather than generic user avatars on the map.
Use communication waves for active voice communication.
Use route markers for checkpoints.
Use shield or pulse symbols for safety states.
Use a compass for orientation.
Use a battery glyph for battery telemetry.
Use a satellite or GPS glyph for positioning status.
Use a helmet or motorcycle glyph where context requires a riding metaphor.
Use consistent arrow geometry across route guidance.
Use icon rotation only when it represents direction.
Do not animate icons continuously without semantic reason.
Ensure icons remain understandable at glanceable sizes.
# 09 — SPATIAL MEMBRANE REPLACEMENT
Replace generic SpatialMembrane cards with contextual instrument surfaces.
Instrument surfaces should have fewer rounded corners than the current system.
Use corner radii between zero and twenty-four pixels based on function.
Use sharper geometry for technical telemetry.
Use circular geometry for control instruments.
Use soft geometry only for human-facing content or touch surfaces.
Use transparent surfaces where map context remains important.
Use opaque surfaces when readability or safety requires isolation.
Avoid blur as the default treatment.
Use blur selectively for floating overlays over busy maps.
Keep backdrop blur between eight and sixteen pixels where needed.
Use subtle one-pixel borders for separation.
Use gradients only for depth and readability.
Avoid heavy glassmorphism shadows.
Use soft ambient shadows around detached controls.
Use inner highlights only on physical-control-inspired surfaces.
Use thin technical rules instead of card borders.
Use negative space to create grouping.
Make every container earn its existence.
Remove any container that does not improve comprehension.
# 10 — HOME COCKPIT
Define the home cockpit as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the home cockpit benefits from geographic awareness.
Use a restrained near-black foundation behind the home cockpit.
Use #F4F7FA for primary readable values in the home cockpit.
Use #AAB1BD for supporting labels in the home cockpit.
Use #66707D for low-priority metadata in the home cockpit.
Use #FF4D21 only for Rideclub-primary actions in the home cockpit.
Use cyan for live communication state when applicable to the home cockpit.
Use green for successful or healthy state when applicable to the home cockpit.
Use amber for caution state when applicable to the home cockpit.
Use red only for critical state when applicable to the home cockpit.
Use technical typography for telemetry values associated with the home cockpit.
Use human-readable typography for rider-facing copy associated with the home cockpit.
Avoid unnecessary rounded rectangles in the home cockpit.
Avoid placing every datum inside its own container in the home cockpit.
Use one-pixel structural rules when the home cockpit needs visual grouping.
Use negative space as the first grouping mechanism in the home cockpit.
Use radial geometry when the home cockpit represents a measurable quantity.
Use nodes when the home cockpit represents people or geographic entities.
Use lines when the home cockpit represents a relationship or sequence.
Use rings when the home cockpit represents progress, cohesion, or capacity.
Use large numerals when the home cockpit contains a primary metric.
Use compact labels when the home cockpit contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive home cockpit controls.
Provide a larger sixty-four-pixel interaction zone for the most important home cockpit action during riding.
Do not require precise tapping for critical home cockpit actions.
Use hold-to-confirm for irreversible or safety-sensitive home cockpit actions where appropriate.
Provide immediate visual feedback for every interactive home cockpit action.
Animate the home cockpit only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the home cockpit.
Use sixty-to-two-hundred-fifty millisecond transitions for normal home cockpit UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the home cockpit.
Use opacity changes to establish secondary hierarchy in the home cockpit.
Use scale changes sparingly in the home cockpit.
Avoid large bounce animations in the home cockpit.
Use subtle glow to indicate active state in the home cockpit.
Never use glow as the only indicator of an important home cockpit state.
Pair important home cockpit states with text, iconography, or geometry.
Preserve the visual hierarchy of the home cockpit under reduced-motion settings.
Ensure the home cockpit remains understandable without animation.
Ensure the home cockpit remains usable at high text zoom.
Ensure the home cockpit remains usable in strong outdoor light where possible.
Use high contrast between the home cockpit primary value and its background.
Do not use tiny gray text for essential home cockpit information.
Keep secondary home cockpit information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the home cockpit.
Use uppercase tracking only for short telemetry labels in the home cockpit.
Use tabular numerals for changing home cockpit values.
Keep decimal precision consistent across the home cockpit.
Use locale-aware formatting for distance and speed in the home cockpit.
Use metric units by default for the home cockpit when the user is in a metric locale.
Allow unit preferences to be changed in settings for the home cockpit.
Use safe-area insets around the home cockpit on mobile devices.
Keep important home cockpit content away from gesture navigation edges.
Support landscape orientation for riding-focused home cockpit screens.
Support portrait orientation for planning-focused home cockpit screens.
Allow the home cockpit to reorganize rather than simply shrink at smaller widths.
Do not stack every home cockpit element vertically on mobile.
Use edge rails for compact home cockpit telemetry on narrow screens.
Use bottom sheets only when the home cockpit needs temporary detailed interaction.
Avoid permanent bottom sheets for the home cockpit unless the screen is specifically designed around one.
Keep map gestures available whenever the home cockpit does not require modal focus.
Prevent accidental map gestures while interacting with critical home cockpit controls.
Use pointer-events layering intentionally for the home cockpit.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the home cockpit.
Use MapLibre layers for geographic information whenever possible for the home cockpit.
Use DOM overlays only for interaction-heavy home cockpit controls.
Keep route geometry visually dominant over secondary map labels in the home cockpit.
Dim irrelevant map detail behind active home cockpit guidance.
Use a clear active route line for the home cockpit.
Use a thinner inactive route line for alternate home cockpit paths.
Use checkpoint nodes to divide long home cockpit journeys into understandable segments.
Use start and destination markers consistently in the home cockpit.
Use directional orientation for moving rider markers in the home cockpit.
Avoid using generic pins for every home cockpit object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the home cockpit.
Use clustering when many home cockpit entities overlap.
Use expansion behavior when a home cockpit cluster is selected.
Use proximity to determine emphasis for nearby home cockpit entities.
Use distance labels only when distance is actionable for the home cockpit.
Use live state indicators for connected home cockpit entities.
Use stale-state indicators when home cockpit data has not updated recently.
Never imply live home cockpit data when the network is offline.
Clearly communicate offline state within the home cockpit.
Use cached data gracefully for the home cockpit.
Design the home cockpit to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the home cockpit.
Show network state without turning the home cockpit into a diagnostic screen.
Keep system diagnostics secondary to the home cockpit user goal.
Use haptic-ready interaction semantics for the home cockpit where supported.
Use sound-ready states for the home cockpit where auditory feedback is useful.
Do not make sound the only indication of a critical home cockpit state.
Use clear visual acknowledgment after the home cockpit receives an action.
Use optimistic feedback only when the home cockpit action can safely be reversed.
Use progress indicators for long-running home cockpit operations.
Use skeletons only when they help preserve the home cockpit layout.
Avoid generic spinner-only loading states for major home cockpit screens.
Provide purposeful empty states for the home cockpit.
Provide recovery actions for home cockpit errors.
Keep error messages concise and actionable in the home cockpit.
Use a technical but human tone for home cockpit system messages.
Never use jargon that the rider cannot understand in the home cockpit.
Keep safety-critical copy direct and unambiguous in the home cockpit.
Validate the home cockpit at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the home cockpit at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the home cockpit in both portrait and landscape layouts.
Validate the home cockpit with long rider names.
Validate the home cockpit with long route names.
Validate the home cockpit with zero riders.
Validate the home cockpit with one rider.
Validate the home cockpit with a full group.
Validate the home cockpit with slow network conditions.
Validate the home cockpit with no network.
Validate the home cockpit with poor GPS accuracy.
Validate the home cockpit with rapidly changing telemetry.
Validate the home cockpit with accessibility text scaling.
Validate the home cockpit with reduced motion.
Validate the home cockpit with keyboard navigation where applicable.
Validate the home cockpit with screen readers for non-driving planning contexts.
Validate the home cockpit with touch and pointer input.
Validate the home cockpit with glove-friendly target sizing.
Document every interactive state of the home cockpit.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the home cockpit.
Create a reusable component contract for the home cockpit.
Keep component APIs semantic rather than visual-only for the home cockpit.
Separate data state from presentation state in the home cockpit.
Keep animation state separate from business state in the home cockpit.
Avoid hardcoding user-specific values into the home cockpit.
Drive home cockpit values from the application's data layer.
Keep the home cockpit resilient to missing optional data.
Keep the home cockpit deterministic during replay or ride-history inspection.
Use consistent time formatting across the home cockpit.
Use consistent distance formatting across the home cockpit.
Use consistent rider status terminology across the home cockpit.
Use consistent alert severity terminology across the home cockpit.
Use consistent route terminology across the home cockpit.
Use consistent checkpoint terminology across the home cockpit.
Use consistent connection terminology across the home cockpit.
Do not introduce a new visual pattern for the home cockpit if an existing pattern already solves the same problem.
Prefer composition over component nesting in the home cockpit.
Keep the visual surface of the home cockpit calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary home cockpit information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the home cockpit.
Use the reference HMI's instrument-panel logic as inspiration for the home cockpit.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the home cockpit feel native to Rideclub's spatial operating-system concept.
The final home cockpit must not look like a generic admin dashboard.
The final home cockpit must not look like a generic fintech dashboard.
The final home cockpit must not look like a generic social feed.
The final home cockpit must not look like a generic navigation clone.
The final home cockpit must feel like one cohesive Rideclub cockpit.
# 11 — ACTIVE RIDE COCKPIT
Define the active ride as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the active ride benefits from geographic awareness.
Use a restrained near-black foundation behind the active ride.
Use #F4F7FA for primary readable values in the active ride.
Use #AAB1BD for supporting labels in the active ride.
Use #66707D for low-priority metadata in the active ride.
Use #FF4D21 only for Rideclub-primary actions in the active ride.
Use cyan for live communication state when applicable to the active ride.
Use green for successful or healthy state when applicable to the active ride.
Use amber for caution state when applicable to the active ride.
Use red only for critical state when applicable to the active ride.
Use technical typography for telemetry values associated with the active ride.
Use human-readable typography for rider-facing copy associated with the active ride.
Avoid unnecessary rounded rectangles in the active ride.
Avoid placing every datum inside its own container in the active ride.
Use one-pixel structural rules when the active ride needs visual grouping.
Use negative space as the first grouping mechanism in the active ride.
Use radial geometry when the active ride represents a measurable quantity.
Use nodes when the active ride represents people or geographic entities.
Use lines when the active ride represents a relationship or sequence.
Use rings when the active ride represents progress, cohesion, or capacity.
Use large numerals when the active ride contains a primary metric.
Use compact labels when the active ride contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive active ride controls.
Provide a larger sixty-four-pixel interaction zone for the most important active ride action during riding.
Do not require precise tapping for critical active ride actions.
Use hold-to-confirm for irreversible or safety-sensitive active ride actions where appropriate.
Provide immediate visual feedback for every interactive active ride action.
Animate the active ride only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the active ride.
Use sixty-to-two-hundred-fifty millisecond transitions for normal active ride UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the active ride.
Use opacity changes to establish secondary hierarchy in the active ride.
Use scale changes sparingly in the active ride.
Avoid large bounce animations in the active ride.
Use subtle glow to indicate active state in the active ride.
Never use glow as the only indicator of an important active ride state.
Pair important active ride states with text, iconography, or geometry.
Preserve the visual hierarchy of the active ride under reduced-motion settings.
Ensure the active ride remains understandable without animation.
Ensure the active ride remains usable at high text zoom.
Ensure the active ride remains usable in strong outdoor light where possible.
Use high contrast between the active ride primary value and its background.
Do not use tiny gray text for essential active ride information.
Keep secondary active ride information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the active ride.
Use uppercase tracking only for short telemetry labels in the active ride.
Use tabular numerals for changing active ride values.
Keep decimal precision consistent across the active ride.
Use locale-aware formatting for distance and speed in the active ride.
Use metric units by default for the active ride when the user is in a metric locale.
Allow unit preferences to be changed in settings for the active ride.
Use safe-area insets around the active ride on mobile devices.
Keep important active ride content away from gesture navigation edges.
Support landscape orientation for riding-focused active ride screens.
Support portrait orientation for planning-focused active ride screens.
Allow the active ride to reorganize rather than simply shrink at smaller widths.
Do not stack every active ride element vertically on mobile.
Use edge rails for compact active ride telemetry on narrow screens.
Use bottom sheets only when the active ride needs temporary detailed interaction.
Avoid permanent bottom sheets for the active ride unless the screen is specifically designed around one.
Keep map gestures available whenever the active ride does not require modal focus.
Prevent accidental map gestures while interacting with critical active ride controls.
Use pointer-events layering intentionally for the active ride.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the active ride.
Use MapLibre layers for geographic information whenever possible for the active ride.
Use DOM overlays only for interaction-heavy active ride controls.
Keep route geometry visually dominant over secondary map labels in the active ride.
Dim irrelevant map detail behind active active ride guidance.
Use a clear active route line for the active ride.
Use a thinner inactive route line for alternate active ride paths.
Use checkpoint nodes to divide long active ride journeys into understandable segments.
Use start and destination markers consistently in the active ride.
Use directional orientation for moving rider markers in the active ride.
Avoid using generic pins for every active ride object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the active ride.
Use clustering when many active ride entities overlap.
Use expansion behavior when a active ride cluster is selected.
Use proximity to determine emphasis for nearby active ride entities.
Use distance labels only when distance is actionable for the active ride.
Use live state indicators for connected active ride entities.
Use stale-state indicators when active ride data has not updated recently.
Never imply live active ride data when the network is offline.
Clearly communicate offline state within the active ride.
Use cached data gracefully for the active ride.
Design the active ride to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the active ride.
Show network state without turning the active ride into a diagnostic screen.
Keep system diagnostics secondary to the active ride user goal.
Use haptic-ready interaction semantics for the active ride where supported.
Use sound-ready states for the active ride where auditory feedback is useful.
Do not make sound the only indication of a critical active ride state.
Use clear visual acknowledgment after the active ride receives an action.
Use optimistic feedback only when the active ride action can safely be reversed.
Use progress indicators for long-running active ride operations.
Use skeletons only when they help preserve the active ride layout.
Avoid generic spinner-only loading states for major active ride screens.
Provide purposeful empty states for the active ride.
Provide recovery actions for active ride errors.
Keep error messages concise and actionable in the active ride.
Use a technical but human tone for active ride system messages.
Never use jargon that the rider cannot understand in the active ride.
Keep safety-critical copy direct and unambiguous in the active ride.
Validate the active ride at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the active ride at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the active ride in both portrait and landscape layouts.
Validate the active ride with long rider names.
Validate the active ride with long route names.
Validate the active ride with zero riders.
Validate the active ride with one rider.
Validate the active ride with a full group.
Validate the active ride with slow network conditions.
Validate the active ride with no network.
Validate the active ride with poor GPS accuracy.
Validate the active ride with rapidly changing telemetry.
Validate the active ride with accessibility text scaling.
Validate the active ride with reduced motion.
Validate the active ride with keyboard navigation where applicable.
Validate the active ride with screen readers for non-driving planning contexts.
Validate the active ride with touch and pointer input.
Validate the active ride with glove-friendly target sizing.
Document every interactive state of the active ride.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the active ride.
Create a reusable component contract for the active ride.
Keep component APIs semantic rather than visual-only for the active ride.
Separate data state from presentation state in the active ride.
Keep animation state separate from business state in the active ride.
Avoid hardcoding user-specific values into the active ride.
Drive active ride values from the application's data layer.
Keep the active ride resilient to missing optional data.
Keep the active ride deterministic during replay or ride-history inspection.
Use consistent time formatting across the active ride.
Use consistent distance formatting across the active ride.
Use consistent rider status terminology across the active ride.
Use consistent alert severity terminology across the active ride.
Use consistent route terminology across the active ride.
Use consistent checkpoint terminology across the active ride.
Use consistent connection terminology across the active ride.
Do not introduce a new visual pattern for the active ride if an existing pattern already solves the same problem.
Prefer composition over component nesting in the active ride.
Keep the visual surface of the active ride calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary active ride information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the active ride.
Use the reference HMI's instrument-panel logic as inspiration for the active ride.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the active ride feel native to Rideclub's spatial operating-system concept.
The final active ride must not look like a generic admin dashboard.
The final active ride must not look like a generic fintech dashboard.
The final active ride must not look like a generic social feed.
The final active ride must not look like a generic navigation clone.
The final active ride must feel like one cohesive Rideclub cockpit.
# 12 — NAVIGATION SCREEN
Define the navigation as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the navigation benefits from geographic awareness.
Use a restrained near-black foundation behind the navigation.
Use #F4F7FA for primary readable values in the navigation.
Use #AAB1BD for supporting labels in the navigation.
Use #66707D for low-priority metadata in the navigation.
Use #FF4D21 only for Rideclub-primary actions in the navigation.
Use cyan for live communication state when applicable to the navigation.
Use green for successful or healthy state when applicable to the navigation.
Use amber for caution state when applicable to the navigation.
Use red only for critical state when applicable to the navigation.
Use technical typography for telemetry values associated with the navigation.
Use human-readable typography for rider-facing copy associated with the navigation.
Avoid unnecessary rounded rectangles in the navigation.
Avoid placing every datum inside its own container in the navigation.
Use one-pixel structural rules when the navigation needs visual grouping.
Use negative space as the first grouping mechanism in the navigation.
Use radial geometry when the navigation represents a measurable quantity.
Use nodes when the navigation represents people or geographic entities.
Use lines when the navigation represents a relationship or sequence.
Use rings when the navigation represents progress, cohesion, or capacity.
Use large numerals when the navigation contains a primary metric.
Use compact labels when the navigation contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive navigation controls.
Provide a larger sixty-four-pixel interaction zone for the most important navigation action during riding.
Do not require precise tapping for critical navigation actions.
Use hold-to-confirm for irreversible or safety-sensitive navigation actions where appropriate.
Provide immediate visual feedback for every interactive navigation action.
Animate the navigation only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the navigation.
Use sixty-to-two-hundred-fifty millisecond transitions for normal navigation UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the navigation.
Use opacity changes to establish secondary hierarchy in the navigation.
Use scale changes sparingly in the navigation.
Avoid large bounce animations in the navigation.
Use subtle glow to indicate active state in the navigation.
Never use glow as the only indicator of an important navigation state.
Pair important navigation states with text, iconography, or geometry.
Preserve the visual hierarchy of the navigation under reduced-motion settings.
Ensure the navigation remains understandable without animation.
Ensure the navigation remains usable at high text zoom.
Ensure the navigation remains usable in strong outdoor light where possible.
Use high contrast between the navigation primary value and its background.
Do not use tiny gray text for essential navigation information.
Keep secondary navigation information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the navigation.
Use uppercase tracking only for short telemetry labels in the navigation.
Use tabular numerals for changing navigation values.
Keep decimal precision consistent across the navigation.
Use locale-aware formatting for distance and speed in the navigation.
Use metric units by default for the navigation when the user is in a metric locale.
Allow unit preferences to be changed in settings for the navigation.
Use safe-area insets around the navigation on mobile devices.
Keep important navigation content away from gesture navigation edges.
Support landscape orientation for riding-focused navigation screens.
Support portrait orientation for planning-focused navigation screens.
Allow the navigation to reorganize rather than simply shrink at smaller widths.
Do not stack every navigation element vertically on mobile.
Use edge rails for compact navigation telemetry on narrow screens.
Use bottom sheets only when the navigation needs temporary detailed interaction.
Avoid permanent bottom sheets for the navigation unless the screen is specifically designed around one.
Keep map gestures available whenever the navigation does not require modal focus.
Prevent accidental map gestures while interacting with critical navigation controls.
Use pointer-events layering intentionally for the navigation.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the navigation.
Use MapLibre layers for geographic information whenever possible for the navigation.
Use DOM overlays only for interaction-heavy navigation controls.
Keep route geometry visually dominant over secondary map labels in the navigation.
Dim irrelevant map detail behind active navigation guidance.
Use a clear active route line for the navigation.
Use a thinner inactive route line for alternate navigation paths.
Use checkpoint nodes to divide long navigation journeys into understandable segments.
Use start and destination markers consistently in the navigation.
Use directional orientation for moving rider markers in the navigation.
Avoid using generic pins for every navigation object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the navigation.
Use clustering when many navigation entities overlap.
Use expansion behavior when a navigation cluster is selected.
Use proximity to determine emphasis for nearby navigation entities.
Use distance labels only when distance is actionable for the navigation.
Use live state indicators for connected navigation entities.
Use stale-state indicators when navigation data has not updated recently.
Never imply live navigation data when the network is offline.
Clearly communicate offline state within the navigation.
Use cached data gracefully for the navigation.
Design the navigation to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the navigation.
Show network state without turning the navigation into a diagnostic screen.
Keep system diagnostics secondary to the navigation user goal.
Use haptic-ready interaction semantics for the navigation where supported.
Use sound-ready states for the navigation where auditory feedback is useful.
Do not make sound the only indication of a critical navigation state.
Use clear visual acknowledgment after the navigation receives an action.
Use optimistic feedback only when the navigation action can safely be reversed.
Use progress indicators for long-running navigation operations.
Use skeletons only when they help preserve the navigation layout.
Avoid generic spinner-only loading states for major navigation screens.
Provide purposeful empty states for the navigation.
Provide recovery actions for navigation errors.
Keep error messages concise and actionable in the navigation.
Use a technical but human tone for navigation system messages.
Never use jargon that the rider cannot understand in the navigation.
Keep safety-critical copy direct and unambiguous in the navigation.
Validate the navigation at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the navigation at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the navigation in both portrait and landscape layouts.
Validate the navigation with long rider names.
Validate the navigation with long route names.
Validate the navigation with zero riders.
Validate the navigation with one rider.
Validate the navigation with a full group.
Validate the navigation with slow network conditions.
Validate the navigation with no network.
Validate the navigation with poor GPS accuracy.
Validate the navigation with rapidly changing telemetry.
Validate the navigation with accessibility text scaling.
Validate the navigation with reduced motion.
Validate the navigation with keyboard navigation where applicable.
Validate the navigation with screen readers for non-driving planning contexts.
Validate the navigation with touch and pointer input.
Validate the navigation with glove-friendly target sizing.
Document every interactive state of the navigation.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the navigation.
Create a reusable component contract for the navigation.
Keep component APIs semantic rather than visual-only for the navigation.
Separate data state from presentation state in the navigation.
Keep animation state separate from business state in the navigation.
Avoid hardcoding user-specific values into the navigation.
Drive navigation values from the application's data layer.
Keep the navigation resilient to missing optional data.
Keep the navigation deterministic during replay or ride-history inspection.
Use consistent time formatting across the navigation.
Use consistent distance formatting across the navigation.
Use consistent rider status terminology across the navigation.
Use consistent alert severity terminology across the navigation.
Use consistent route terminology across the navigation.
Use consistent checkpoint terminology across the navigation.
Use consistent connection terminology across the navigation.
Do not introduce a new visual pattern for the navigation if an existing pattern already solves the same problem.
Prefer composition over component nesting in the navigation.
Keep the visual surface of the navigation calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary navigation information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the navigation.
Use the reference HMI's instrument-panel logic as inspiration for the navigation.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the navigation feel native to Rideclub's spatial operating-system concept.
The final navigation must not look like a generic admin dashboard.
The final navigation must not look like a generic fintech dashboard.
The final navigation must not look like a generic social feed.
The final navigation must not look like a generic navigation clone.
The final navigation must feel like one cohesive Rideclub cockpit.
# 13 — TURN-BY-TURN
Define the turn instruction as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the turn instruction benefits from geographic awareness.
Use a restrained near-black foundation behind the turn instruction.
Use #F4F7FA for primary readable values in the turn instruction.
Use #AAB1BD for supporting labels in the turn instruction.
Use #66707D for low-priority metadata in the turn instruction.
Use #FF4D21 only for Rideclub-primary actions in the turn instruction.
Use cyan for live communication state when applicable to the turn instruction.
Use green for successful or healthy state when applicable to the turn instruction.
Use amber for caution state when applicable to the turn instruction.
Use red only for critical state when applicable to the turn instruction.
Use technical typography for telemetry values associated with the turn instruction.
Use human-readable typography for rider-facing copy associated with the turn instruction.
Avoid unnecessary rounded rectangles in the turn instruction.
Avoid placing every datum inside its own container in the turn instruction.
Use one-pixel structural rules when the turn instruction needs visual grouping.
Use negative space as the first grouping mechanism in the turn instruction.
Use radial geometry when the turn instruction represents a measurable quantity.
Use nodes when the turn instruction represents people or geographic entities.
Use lines when the turn instruction represents a relationship or sequence.
Use rings when the turn instruction represents progress, cohesion, or capacity.
Use large numerals when the turn instruction contains a primary metric.
Use compact labels when the turn instruction contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive turn instruction controls.
Provide a larger sixty-four-pixel interaction zone for the most important turn instruction action during riding.
Do not require precise tapping for critical turn instruction actions.
Use hold-to-confirm for irreversible or safety-sensitive turn instruction actions where appropriate.
Provide immediate visual feedback for every interactive turn instruction action.
Animate the turn instruction only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the turn instruction.
Use sixty-to-two-hundred-fifty millisecond transitions for normal turn instruction UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the turn instruction.
Use opacity changes to establish secondary hierarchy in the turn instruction.
Use scale changes sparingly in the turn instruction.
Avoid large bounce animations in the turn instruction.
Use subtle glow to indicate active state in the turn instruction.
Never use glow as the only indicator of an important turn instruction state.
Pair important turn instruction states with text, iconography, or geometry.
Preserve the visual hierarchy of the turn instruction under reduced-motion settings.
Ensure the turn instruction remains understandable without animation.
Ensure the turn instruction remains usable at high text zoom.
Ensure the turn instruction remains usable in strong outdoor light where possible.
Use high contrast between the turn instruction primary value and its background.
Do not use tiny gray text for essential turn instruction information.
Keep secondary turn instruction information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the turn instruction.
Use uppercase tracking only for short telemetry labels in the turn instruction.
Use tabular numerals for changing turn instruction values.
Keep decimal precision consistent across the turn instruction.
Use locale-aware formatting for distance and speed in the turn instruction.
Use metric units by default for the turn instruction when the user is in a metric locale.
Allow unit preferences to be changed in settings for the turn instruction.
Use safe-area insets around the turn instruction on mobile devices.
Keep important turn instruction content away from gesture navigation edges.
Support landscape orientation for riding-focused turn instruction screens.
Support portrait orientation for planning-focused turn instruction screens.
Allow the turn instruction to reorganize rather than simply shrink at smaller widths.
Do not stack every turn instruction element vertically on mobile.
Use edge rails for compact turn instruction telemetry on narrow screens.
Use bottom sheets only when the turn instruction needs temporary detailed interaction.
Avoid permanent bottom sheets for the turn instruction unless the screen is specifically designed around one.
Keep map gestures available whenever the turn instruction does not require modal focus.
Prevent accidental map gestures while interacting with critical turn instruction controls.
Use pointer-events layering intentionally for the turn instruction.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the turn instruction.
Use MapLibre layers for geographic information whenever possible for the turn instruction.
Use DOM overlays only for interaction-heavy turn instruction controls.
Keep route geometry visually dominant over secondary map labels in the turn instruction.
Dim irrelevant map detail behind active turn instruction guidance.
Use a clear active route line for the turn instruction.
Use a thinner inactive route line for alternate turn instruction paths.
Use checkpoint nodes to divide long turn instruction journeys into understandable segments.
Use start and destination markers consistently in the turn instruction.
Use directional orientation for moving rider markers in the turn instruction.
Avoid using generic pins for every turn instruction object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the turn instruction.
Use clustering when many turn instruction entities overlap.
Use expansion behavior when a turn instruction cluster is selected.
Use proximity to determine emphasis for nearby turn instruction entities.
Use distance labels only when distance is actionable for the turn instruction.
Use live state indicators for connected turn instruction entities.
Use stale-state indicators when turn instruction data has not updated recently.
Never imply live turn instruction data when the network is offline.
Clearly communicate offline state within the turn instruction.
Use cached data gracefully for the turn instruction.
Design the turn instruction to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the turn instruction.
Show network state without turning the turn instruction into a diagnostic screen.
Keep system diagnostics secondary to the turn instruction user goal.
Use haptic-ready interaction semantics for the turn instruction where supported.
Use sound-ready states for the turn instruction where auditory feedback is useful.
Do not make sound the only indication of a critical turn instruction state.
Use clear visual acknowledgment after the turn instruction receives an action.
Use optimistic feedback only when the turn instruction action can safely be reversed.
Use progress indicators for long-running turn instruction operations.
Use skeletons only when they help preserve the turn instruction layout.
Avoid generic spinner-only loading states for major turn instruction screens.
Provide purposeful empty states for the turn instruction.
Provide recovery actions for turn instruction errors.
Keep error messages concise and actionable in the turn instruction.
Use a technical but human tone for turn instruction system messages.
Never use jargon that the rider cannot understand in the turn instruction.
Keep safety-critical copy direct and unambiguous in the turn instruction.
Validate the turn instruction at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the turn instruction at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the turn instruction in both portrait and landscape layouts.
Validate the turn instruction with long rider names.
Validate the turn instruction with long route names.
Validate the turn instruction with zero riders.
Validate the turn instruction with one rider.
Validate the turn instruction with a full group.
Validate the turn instruction with slow network conditions.
Validate the turn instruction with no network.
Validate the turn instruction with poor GPS accuracy.
Validate the turn instruction with rapidly changing telemetry.
Validate the turn instruction with accessibility text scaling.
Validate the turn instruction with reduced motion.
Validate the turn instruction with keyboard navigation where applicable.
Validate the turn instruction with screen readers for non-driving planning contexts.
Validate the turn instruction with touch and pointer input.
Validate the turn instruction with glove-friendly target sizing.
Document every interactive state of the turn instruction.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the turn instruction.
Create a reusable component contract for the turn instruction.
Keep component APIs semantic rather than visual-only for the turn instruction.
Separate data state from presentation state in the turn instruction.
Keep animation state separate from business state in the turn instruction.
Avoid hardcoding user-specific values into the turn instruction.
Drive turn instruction values from the application's data layer.
Keep the turn instruction resilient to missing optional data.
Keep the turn instruction deterministic during replay or ride-history inspection.
Use consistent time formatting across the turn instruction.
Use consistent distance formatting across the turn instruction.
Use consistent rider status terminology across the turn instruction.
Use consistent alert severity terminology across the turn instruction.
Use consistent route terminology across the turn instruction.
Use consistent checkpoint terminology across the turn instruction.
Use consistent connection terminology across the turn instruction.
Do not introduce a new visual pattern for the turn instruction if an existing pattern already solves the same problem.
Prefer composition over component nesting in the turn instruction.
Keep the visual surface of the turn instruction calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary turn instruction information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the turn instruction.
Use the reference HMI's instrument-panel logic as inspiration for the turn instruction.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the turn instruction feel native to Rideclub's spatial operating-system concept.
The final turn instruction must not look like a generic admin dashboard.
The final turn instruction must not look like a generic fintech dashboard.
The final turn instruction must not look like a generic social feed.
The final turn instruction must not look like a generic navigation clone.
The final turn instruction must feel like one cohesive Rideclub cockpit.
# 14 — ROUTE BUILDER
Define the route builder as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the route builder benefits from geographic awareness.
Use a restrained near-black foundation behind the route builder.
Use #F4F7FA for primary readable values in the route builder.
Use #AAB1BD for supporting labels in the route builder.
Use #66707D for low-priority metadata in the route builder.
Use #FF4D21 only for Rideclub-primary actions in the route builder.
Use cyan for live communication state when applicable to the route builder.
Use green for successful or healthy state when applicable to the route builder.
Use amber for caution state when applicable to the route builder.
Use red only for critical state when applicable to the route builder.
Use technical typography for telemetry values associated with the route builder.
Use human-readable typography for rider-facing copy associated with the route builder.
Avoid unnecessary rounded rectangles in the route builder.
Avoid placing every datum inside its own container in the route builder.
Use one-pixel structural rules when the route builder needs visual grouping.
Use negative space as the first grouping mechanism in the route builder.
Use radial geometry when the route builder represents a measurable quantity.
Use nodes when the route builder represents people or geographic entities.
Use lines when the route builder represents a relationship or sequence.
Use rings when the route builder represents progress, cohesion, or capacity.
Use large numerals when the route builder contains a primary metric.
Use compact labels when the route builder contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive route builder controls.
Provide a larger sixty-four-pixel interaction zone for the most important route builder action during riding.
Do not require precise tapping for critical route builder actions.
Use hold-to-confirm for irreversible or safety-sensitive route builder actions where appropriate.
Provide immediate visual feedback for every interactive route builder action.
Animate the route builder only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the route builder.
Use sixty-to-two-hundred-fifty millisecond transitions for normal route builder UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the route builder.
Use opacity changes to establish secondary hierarchy in the route builder.
Use scale changes sparingly in the route builder.
Avoid large bounce animations in the route builder.
Use subtle glow to indicate active state in the route builder.
Never use glow as the only indicator of an important route builder state.
Pair important route builder states with text, iconography, or geometry.
Preserve the visual hierarchy of the route builder under reduced-motion settings.
Ensure the route builder remains understandable without animation.
Ensure the route builder remains usable at high text zoom.
Ensure the route builder remains usable in strong outdoor light where possible.
Use high contrast between the route builder primary value and its background.
Do not use tiny gray text for essential route builder information.
Keep secondary route builder information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the route builder.
Use uppercase tracking only for short telemetry labels in the route builder.
Use tabular numerals for changing route builder values.
Keep decimal precision consistent across the route builder.
Use locale-aware formatting for distance and speed in the route builder.
Use metric units by default for the route builder when the user is in a metric locale.
Allow unit preferences to be changed in settings for the route builder.
Use safe-area insets around the route builder on mobile devices.
Keep important route builder content away from gesture navigation edges.
Support landscape orientation for riding-focused route builder screens.
Support portrait orientation for planning-focused route builder screens.
Allow the route builder to reorganize rather than simply shrink at smaller widths.
Do not stack every route builder element vertically on mobile.
Use edge rails for compact route builder telemetry on narrow screens.
Use bottom sheets only when the route builder needs temporary detailed interaction.
Avoid permanent bottom sheets for the route builder unless the screen is specifically designed around one.
Keep map gestures available whenever the route builder does not require modal focus.
Prevent accidental map gestures while interacting with critical route builder controls.
Use pointer-events layering intentionally for the route builder.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the route builder.
Use MapLibre layers for geographic information whenever possible for the route builder.
Use DOM overlays only for interaction-heavy route builder controls.
Keep route geometry visually dominant over secondary map labels in the route builder.
Dim irrelevant map detail behind active route builder guidance.
Use a clear active route line for the route builder.
Use a thinner inactive route line for alternate route builder paths.
Use checkpoint nodes to divide long route builder journeys into understandable segments.
Use start and destination markers consistently in the route builder.
Use directional orientation for moving rider markers in the route builder.
Avoid using generic pins for every route builder object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the route builder.
Use clustering when many route builder entities overlap.
Use expansion behavior when a route builder cluster is selected.
Use proximity to determine emphasis for nearby route builder entities.
Use distance labels only when distance is actionable for the route builder.
Use live state indicators for connected route builder entities.
Use stale-state indicators when route builder data has not updated recently.
Never imply live route builder data when the network is offline.
Clearly communicate offline state within the route builder.
Use cached data gracefully for the route builder.
Design the route builder to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the route builder.
Show network state without turning the route builder into a diagnostic screen.
Keep system diagnostics secondary to the route builder user goal.
Use haptic-ready interaction semantics for the route builder where supported.
Use sound-ready states for the route builder where auditory feedback is useful.
Do not make sound the only indication of a critical route builder state.
Use clear visual acknowledgment after the route builder receives an action.
Use optimistic feedback only when the route builder action can safely be reversed.
Use progress indicators for long-running route builder operations.
Use skeletons only when they help preserve the route builder layout.
Avoid generic spinner-only loading states for major route builder screens.
Provide purposeful empty states for the route builder.
Provide recovery actions for route builder errors.
Keep error messages concise and actionable in the route builder.
Use a technical but human tone for route builder system messages.
Never use jargon that the rider cannot understand in the route builder.
Keep safety-critical copy direct and unambiguous in the route builder.
Validate the route builder at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the route builder at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the route builder in both portrait and landscape layouts.
Validate the route builder with long rider names.
Validate the route builder with long route names.
Validate the route builder with zero riders.
Validate the route builder with one rider.
Validate the route builder with a full group.
Validate the route builder with slow network conditions.
Validate the route builder with no network.
Validate the route builder with poor GPS accuracy.
Validate the route builder with rapidly changing telemetry.
Validate the route builder with accessibility text scaling.
Validate the route builder with reduced motion.
Validate the route builder with keyboard navigation where applicable.
Validate the route builder with screen readers for non-driving planning contexts.
Validate the route builder with touch and pointer input.
Validate the route builder with glove-friendly target sizing.
Document every interactive state of the route builder.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the route builder.
Create a reusable component contract for the route builder.
Keep component APIs semantic rather than visual-only for the route builder.
Separate data state from presentation state in the route builder.
Keep animation state separate from business state in the route builder.
Avoid hardcoding user-specific values into the route builder.
Drive route builder values from the application's data layer.
Keep the route builder resilient to missing optional data.
Keep the route builder deterministic during replay or ride-history inspection.
Use consistent time formatting across the route builder.
Use consistent distance formatting across the route builder.
Use consistent rider status terminology across the route builder.
Use consistent alert severity terminology across the route builder.
Use consistent route terminology across the route builder.
Use consistent checkpoint terminology across the route builder.
Use consistent connection terminology across the route builder.
Do not introduce a new visual pattern for the route builder if an existing pattern already solves the same problem.
Prefer composition over component nesting in the route builder.
Keep the visual surface of the route builder calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary route builder information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the route builder.
Use the reference HMI's instrument-panel logic as inspiration for the route builder.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the route builder feel native to Rideclub's spatial operating-system concept.
The final route builder must not look like a generic admin dashboard.
The final route builder must not look like a generic fintech dashboard.
The final route builder must not look like a generic social feed.
The final route builder must not look like a generic navigation clone.
The final route builder must feel like one cohesive Rideclub cockpit.
# 15 — CHECKPOINT SYSTEM
Define the checkpoint as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the checkpoint benefits from geographic awareness.
Use a restrained near-black foundation behind the checkpoint.
Use #F4F7FA for primary readable values in the checkpoint.
Use #AAB1BD for supporting labels in the checkpoint.
Use #66707D for low-priority metadata in the checkpoint.
Use #FF4D21 only for Rideclub-primary actions in the checkpoint.
Use cyan for live communication state when applicable to the checkpoint.
Use green for successful or healthy state when applicable to the checkpoint.
Use amber for caution state when applicable to the checkpoint.
Use red only for critical state when applicable to the checkpoint.
Use technical typography for telemetry values associated with the checkpoint.
Use human-readable typography for rider-facing copy associated with the checkpoint.
Avoid unnecessary rounded rectangles in the checkpoint.
Avoid placing every datum inside its own container in the checkpoint.
Use one-pixel structural rules when the checkpoint needs visual grouping.
Use negative space as the first grouping mechanism in the checkpoint.
Use radial geometry when the checkpoint represents a measurable quantity.
Use nodes when the checkpoint represents people or geographic entities.
Use lines when the checkpoint represents a relationship or sequence.
Use rings when the checkpoint represents progress, cohesion, or capacity.
Use large numerals when the checkpoint contains a primary metric.
Use compact labels when the checkpoint contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive checkpoint controls.
Provide a larger sixty-four-pixel interaction zone for the most important checkpoint action during riding.
Do not require precise tapping for critical checkpoint actions.
Use hold-to-confirm for irreversible or safety-sensitive checkpoint actions where appropriate.
Provide immediate visual feedback for every interactive checkpoint action.
Animate the checkpoint only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the checkpoint.
Use sixty-to-two-hundred-fifty millisecond transitions for normal checkpoint UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the checkpoint.
Use opacity changes to establish secondary hierarchy in the checkpoint.
Use scale changes sparingly in the checkpoint.
Avoid large bounce animations in the checkpoint.
Use subtle glow to indicate active state in the checkpoint.
Never use glow as the only indicator of an important checkpoint state.
Pair important checkpoint states with text, iconography, or geometry.
Preserve the visual hierarchy of the checkpoint under reduced-motion settings.
Ensure the checkpoint remains understandable without animation.
Ensure the checkpoint remains usable at high text zoom.
Ensure the checkpoint remains usable in strong outdoor light where possible.
Use high contrast between the checkpoint primary value and its background.
Do not use tiny gray text for essential checkpoint information.
Keep secondary checkpoint information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the checkpoint.
Use uppercase tracking only for short telemetry labels in the checkpoint.
Use tabular numerals for changing checkpoint values.
Keep decimal precision consistent across the checkpoint.
Use locale-aware formatting for distance and speed in the checkpoint.
Use metric units by default for the checkpoint when the user is in a metric locale.
Allow unit preferences to be changed in settings for the checkpoint.
Use safe-area insets around the checkpoint on mobile devices.
Keep important checkpoint content away from gesture navigation edges.
Support landscape orientation for riding-focused checkpoint screens.
Support portrait orientation for planning-focused checkpoint screens.
Allow the checkpoint to reorganize rather than simply shrink at smaller widths.
Do not stack every checkpoint element vertically on mobile.
Use edge rails for compact checkpoint telemetry on narrow screens.
Use bottom sheets only when the checkpoint needs temporary detailed interaction.
Avoid permanent bottom sheets for the checkpoint unless the screen is specifically designed around one.
Keep map gestures available whenever the checkpoint does not require modal focus.
Prevent accidental map gestures while interacting with critical checkpoint controls.
Use pointer-events layering intentionally for the checkpoint.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the checkpoint.
Use MapLibre layers for geographic information whenever possible for the checkpoint.
Use DOM overlays only for interaction-heavy checkpoint controls.
Keep route geometry visually dominant over secondary map labels in the checkpoint.
Dim irrelevant map detail behind active checkpoint guidance.
Use a clear active route line for the checkpoint.
Use a thinner inactive route line for alternate checkpoint paths.
Use checkpoint nodes to divide long checkpoint journeys into understandable segments.
Use start and destination markers consistently in the checkpoint.
Use directional orientation for moving rider markers in the checkpoint.
Avoid using generic pins for every checkpoint object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the checkpoint.
Use clustering when many checkpoint entities overlap.
Use expansion behavior when a checkpoint cluster is selected.
Use proximity to determine emphasis for nearby checkpoint entities.
Use distance labels only when distance is actionable for the checkpoint.
Use live state indicators for connected checkpoint entities.
Use stale-state indicators when checkpoint data has not updated recently.
Never imply live checkpoint data when the network is offline.
Clearly communicate offline state within the checkpoint.
Use cached data gracefully for the checkpoint.
Design the checkpoint to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the checkpoint.
Show network state without turning the checkpoint into a diagnostic screen.
Keep system diagnostics secondary to the checkpoint user goal.
Use haptic-ready interaction semantics for the checkpoint where supported.
Use sound-ready states for the checkpoint where auditory feedback is useful.
Do not make sound the only indication of a critical checkpoint state.
Use clear visual acknowledgment after the checkpoint receives an action.
Use optimistic feedback only when the checkpoint action can safely be reversed.
Use progress indicators for long-running checkpoint operations.
Use skeletons only when they help preserve the checkpoint layout.
Avoid generic spinner-only loading states for major checkpoint screens.
Provide purposeful empty states for the checkpoint.
Provide recovery actions for checkpoint errors.
Keep error messages concise and actionable in the checkpoint.
Use a technical but human tone for checkpoint system messages.
Never use jargon that the rider cannot understand in the checkpoint.
Keep safety-critical copy direct and unambiguous in the checkpoint.
Validate the checkpoint at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the checkpoint at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the checkpoint in both portrait and landscape layouts.
Validate the checkpoint with long rider names.
Validate the checkpoint with long route names.
Validate the checkpoint with zero riders.
Validate the checkpoint with one rider.
Validate the checkpoint with a full group.
Validate the checkpoint with slow network conditions.
Validate the checkpoint with no network.
Validate the checkpoint with poor GPS accuracy.
Validate the checkpoint with rapidly changing telemetry.
Validate the checkpoint with accessibility text scaling.
Validate the checkpoint with reduced motion.
Validate the checkpoint with keyboard navigation where applicable.
Validate the checkpoint with screen readers for non-driving planning contexts.
Validate the checkpoint with touch and pointer input.
Validate the checkpoint with glove-friendly target sizing.
Document every interactive state of the checkpoint.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the checkpoint.
Create a reusable component contract for the checkpoint.
Keep component APIs semantic rather than visual-only for the checkpoint.
Separate data state from presentation state in the checkpoint.
Keep animation state separate from business state in the checkpoint.
Avoid hardcoding user-specific values into the checkpoint.
Drive checkpoint values from the application's data layer.
Keep the checkpoint resilient to missing optional data.
Keep the checkpoint deterministic during replay or ride-history inspection.
Use consistent time formatting across the checkpoint.
Use consistent distance formatting across the checkpoint.
Use consistent rider status terminology across the checkpoint.
Use consistent alert severity terminology across the checkpoint.
Use consistent route terminology across the checkpoint.
Use consistent checkpoint terminology across the checkpoint.
Use consistent connection terminology across the checkpoint.
Do not introduce a new visual pattern for the checkpoint if an existing pattern already solves the same problem.
Prefer composition over component nesting in the checkpoint.
Keep the visual surface of the checkpoint calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary checkpoint information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the checkpoint.
Use the reference HMI's instrument-panel logic as inspiration for the checkpoint.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the checkpoint feel native to Rideclub's spatial operating-system concept.
The final checkpoint must not look like a generic admin dashboard.
The final checkpoint must not look like a generic fintech dashboard.
The final checkpoint must not look like a generic social feed.
The final checkpoint must not look like a generic navigation clone.
The final checkpoint must feel like one cohesive Rideclub cockpit.
# 16 — GROUP RIDE NETWORK
Define the group network as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the group network benefits from geographic awareness.
Use a restrained near-black foundation behind the group network.
Use #F4F7FA for primary readable values in the group network.
Use #AAB1BD for supporting labels in the group network.
Use #66707D for low-priority metadata in the group network.
Use #FF4D21 only for Rideclub-primary actions in the group network.
Use cyan for live communication state when applicable to the group network.
Use green for successful or healthy state when applicable to the group network.
Use amber for caution state when applicable to the group network.
Use red only for critical state when applicable to the group network.
Use technical typography for telemetry values associated with the group network.
Use human-readable typography for rider-facing copy associated with the group network.
Avoid unnecessary rounded rectangles in the group network.
Avoid placing every datum inside its own container in the group network.
Use one-pixel structural rules when the group network needs visual grouping.
Use negative space as the first grouping mechanism in the group network.
Use radial geometry when the group network represents a measurable quantity.
Use nodes when the group network represents people or geographic entities.
Use lines when the group network represents a relationship or sequence.
Use rings when the group network represents progress, cohesion, or capacity.
Use large numerals when the group network contains a primary metric.
Use compact labels when the group network contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive group network controls.
Provide a larger sixty-four-pixel interaction zone for the most important group network action during riding.
Do not require precise tapping for critical group network actions.
Use hold-to-confirm for irreversible or safety-sensitive group network actions where appropriate.
Provide immediate visual feedback for every interactive group network action.
Animate the group network only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the group network.
Use sixty-to-two-hundred-fifty millisecond transitions for normal group network UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the group network.
Use opacity changes to establish secondary hierarchy in the group network.
Use scale changes sparingly in the group network.
Avoid large bounce animations in the group network.
Use subtle glow to indicate active state in the group network.
Never use glow as the only indicator of an important group network state.
Pair important group network states with text, iconography, or geometry.
Preserve the visual hierarchy of the group network under reduced-motion settings.
Ensure the group network remains understandable without animation.
Ensure the group network remains usable at high text zoom.
Ensure the group network remains usable in strong outdoor light where possible.
Use high contrast between the group network primary value and its background.
Do not use tiny gray text for essential group network information.
Keep secondary group network information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the group network.
Use uppercase tracking only for short telemetry labels in the group network.
Use tabular numerals for changing group network values.
Keep decimal precision consistent across the group network.
Use locale-aware formatting for distance and speed in the group network.
Use metric units by default for the group network when the user is in a metric locale.
Allow unit preferences to be changed in settings for the group network.
Use safe-area insets around the group network on mobile devices.
Keep important group network content away from gesture navigation edges.
Support landscape orientation for riding-focused group network screens.
Support portrait orientation for planning-focused group network screens.
Allow the group network to reorganize rather than simply shrink at smaller widths.
Do not stack every group network element vertically on mobile.
Use edge rails for compact group network telemetry on narrow screens.
Use bottom sheets only when the group network needs temporary detailed interaction.
Avoid permanent bottom sheets for the group network unless the screen is specifically designed around one.
Keep map gestures available whenever the group network does not require modal focus.
Prevent accidental map gestures while interacting with critical group network controls.
Use pointer-events layering intentionally for the group network.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the group network.
Use MapLibre layers for geographic information whenever possible for the group network.
Use DOM overlays only for interaction-heavy group network controls.
Keep route geometry visually dominant over secondary map labels in the group network.
Dim irrelevant map detail behind active group network guidance.
Use a clear active route line for the group network.
Use a thinner inactive route line for alternate group network paths.
Use checkpoint nodes to divide long group network journeys into understandable segments.
Use start and destination markers consistently in the group network.
Use directional orientation for moving rider markers in the group network.
Avoid using generic pins for every group network object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the group network.
Use clustering when many group network entities overlap.
Use expansion behavior when a group network cluster is selected.
Use proximity to determine emphasis for nearby group network entities.
Use distance labels only when distance is actionable for the group network.
Use live state indicators for connected group network entities.
Use stale-state indicators when group network data has not updated recently.
Never imply live group network data when the network is offline.
Clearly communicate offline state within the group network.
Use cached data gracefully for the group network.
Design the group network to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the group network.
Show network state without turning the group network into a diagnostic screen.
Keep system diagnostics secondary to the group network user goal.
Use haptic-ready interaction semantics for the group network where supported.
Use sound-ready states for the group network where auditory feedback is useful.
Do not make sound the only indication of a critical group network state.
Use clear visual acknowledgment after the group network receives an action.
Use optimistic feedback only when the group network action can safely be reversed.
Use progress indicators for long-running group network operations.
Use skeletons only when they help preserve the group network layout.
Avoid generic spinner-only loading states for major group network screens.
Provide purposeful empty states for the group network.
Provide recovery actions for group network errors.
Keep error messages concise and actionable in the group network.
Use a technical but human tone for group network system messages.
Never use jargon that the rider cannot understand in the group network.
Keep safety-critical copy direct and unambiguous in the group network.
Validate the group network at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the group network at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the group network in both portrait and landscape layouts.
Validate the group network with long rider names.
Validate the group network with long route names.
Validate the group network with zero riders.
Validate the group network with one rider.
Validate the group network with a full group.
Validate the group network with slow network conditions.
Validate the group network with no network.
Validate the group network with poor GPS accuracy.
Validate the group network with rapidly changing telemetry.
Validate the group network with accessibility text scaling.
Validate the group network with reduced motion.
Validate the group network with keyboard navigation where applicable.
Validate the group network with screen readers for non-driving planning contexts.
Validate the group network with touch and pointer input.
Validate the group network with glove-friendly target sizing.
Document every interactive state of the group network.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the group network.
Create a reusable component contract for the group network.
Keep component APIs semantic rather than visual-only for the group network.
Separate data state from presentation state in the group network.
Keep animation state separate from business state in the group network.
Avoid hardcoding user-specific values into the group network.
Drive group network values from the application's data layer.
Keep the group network resilient to missing optional data.
Keep the group network deterministic during replay or ride-history inspection.
Use consistent time formatting across the group network.
Use consistent distance formatting across the group network.
Use consistent rider status terminology across the group network.
Use consistent alert severity terminology across the group network.
Use consistent route terminology across the group network.
Use consistent checkpoint terminology across the group network.
Use consistent connection terminology across the group network.
Do not introduce a new visual pattern for the group network if an existing pattern already solves the same problem.
Prefer composition over component nesting in the group network.
Keep the visual surface of the group network calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary group network information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the group network.
Use the reference HMI's instrument-panel logic as inspiration for the group network.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the group network feel native to Rideclub's spatial operating-system concept.
The final group network must not look like a generic admin dashboard.
The final group network must not look like a generic fintech dashboard.
The final group network must not look like a generic social feed.
The final group network must not look like a generic navigation clone.
The final group network must feel like one cohesive Rideclub cockpit.
# 17 — RIDER PULSE
Define the rider pulse as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the rider pulse benefits from geographic awareness.
Use a restrained near-black foundation behind the rider pulse.
Use #F4F7FA for primary readable values in the rider pulse.
Use #AAB1BD for supporting labels in the rider pulse.
Use #66707D for low-priority metadata in the rider pulse.
Use #FF4D21 only for Rideclub-primary actions in the rider pulse.
Use cyan for live communication state when applicable to the rider pulse.
Use green for successful or healthy state when applicable to the rider pulse.
Use amber for caution state when applicable to the rider pulse.
Use red only for critical state when applicable to the rider pulse.
Use technical typography for telemetry values associated with the rider pulse.
Use human-readable typography for rider-facing copy associated with the rider pulse.
Avoid unnecessary rounded rectangles in the rider pulse.
Avoid placing every datum inside its own container in the rider pulse.
Use one-pixel structural rules when the rider pulse needs visual grouping.
Use negative space as the first grouping mechanism in the rider pulse.
Use radial geometry when the rider pulse represents a measurable quantity.
Use nodes when the rider pulse represents people or geographic entities.
Use lines when the rider pulse represents a relationship or sequence.
Use rings when the rider pulse represents progress, cohesion, or capacity.
Use large numerals when the rider pulse contains a primary metric.
Use compact labels when the rider pulse contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive rider pulse controls.
Provide a larger sixty-four-pixel interaction zone for the most important rider pulse action during riding.
Do not require precise tapping for critical rider pulse actions.
Use hold-to-confirm for irreversible or safety-sensitive rider pulse actions where appropriate.
Provide immediate visual feedback for every interactive rider pulse action.
Animate the rider pulse only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the rider pulse.
Use sixty-to-two-hundred-fifty millisecond transitions for normal rider pulse UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the rider pulse.
Use opacity changes to establish secondary hierarchy in the rider pulse.
Use scale changes sparingly in the rider pulse.
Avoid large bounce animations in the rider pulse.
Use subtle glow to indicate active state in the rider pulse.
Never use glow as the only indicator of an important rider pulse state.
Pair important rider pulse states with text, iconography, or geometry.
Preserve the visual hierarchy of the rider pulse under reduced-motion settings.
Ensure the rider pulse remains understandable without animation.
Ensure the rider pulse remains usable at high text zoom.
Ensure the rider pulse remains usable in strong outdoor light where possible.
Use high contrast between the rider pulse primary value and its background.
Do not use tiny gray text for essential rider pulse information.
Keep secondary rider pulse information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the rider pulse.
Use uppercase tracking only for short telemetry labels in the rider pulse.
Use tabular numerals for changing rider pulse values.
Keep decimal precision consistent across the rider pulse.
Use locale-aware formatting for distance and speed in the rider pulse.
Use metric units by default for the rider pulse when the user is in a metric locale.
Allow unit preferences to be changed in settings for the rider pulse.
Use safe-area insets around the rider pulse on mobile devices.
Keep important rider pulse content away from gesture navigation edges.
Support landscape orientation for riding-focused rider pulse screens.
Support portrait orientation for planning-focused rider pulse screens.
Allow the rider pulse to reorganize rather than simply shrink at smaller widths.
Do not stack every rider pulse element vertically on mobile.
Use edge rails for compact rider pulse telemetry on narrow screens.
Use bottom sheets only when the rider pulse needs temporary detailed interaction.
Avoid permanent bottom sheets for the rider pulse unless the screen is specifically designed around one.
Keep map gestures available whenever the rider pulse does not require modal focus.
Prevent accidental map gestures while interacting with critical rider pulse controls.
Use pointer-events layering intentionally for the rider pulse.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the rider pulse.
Use MapLibre layers for geographic information whenever possible for the rider pulse.
Use DOM overlays only for interaction-heavy rider pulse controls.
Keep route geometry visually dominant over secondary map labels in the rider pulse.
Dim irrelevant map detail behind active rider pulse guidance.
Use a clear active route line for the rider pulse.
Use a thinner inactive route line for alternate rider pulse paths.
Use checkpoint nodes to divide long rider pulse journeys into understandable segments.
Use start and destination markers consistently in the rider pulse.
Use directional orientation for moving rider markers in the rider pulse.
Avoid using generic pins for every rider pulse object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the rider pulse.
Use clustering when many rider pulse entities overlap.
Use expansion behavior when a rider pulse cluster is selected.
Use proximity to determine emphasis for nearby rider pulse entities.
Use distance labels only when distance is actionable for the rider pulse.
Use live state indicators for connected rider pulse entities.
Use stale-state indicators when rider pulse data has not updated recently.
Never imply live rider pulse data when the network is offline.
Clearly communicate offline state within the rider pulse.
Use cached data gracefully for the rider pulse.
Design the rider pulse to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the rider pulse.
Show network state without turning the rider pulse into a diagnostic screen.
Keep system diagnostics secondary to the rider pulse user goal.
Use haptic-ready interaction semantics for the rider pulse where supported.
Use sound-ready states for the rider pulse where auditory feedback is useful.
Do not make sound the only indication of a critical rider pulse state.
Use clear visual acknowledgment after the rider pulse receives an action.
Use optimistic feedback only when the rider pulse action can safely be reversed.
Use progress indicators for long-running rider pulse operations.
Use skeletons only when they help preserve the rider pulse layout.
Avoid generic spinner-only loading states for major rider pulse screens.
Provide purposeful empty states for the rider pulse.
Provide recovery actions for rider pulse errors.
Keep error messages concise and actionable in the rider pulse.
Use a technical but human tone for rider pulse system messages.
Never use jargon that the rider cannot understand in the rider pulse.
Keep safety-critical copy direct and unambiguous in the rider pulse.
Validate the rider pulse at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the rider pulse at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the rider pulse in both portrait and landscape layouts.
Validate the rider pulse with long rider names.
Validate the rider pulse with long route names.
Validate the rider pulse with zero riders.
Validate the rider pulse with one rider.
Validate the rider pulse with a full group.
Validate the rider pulse with slow network conditions.
Validate the rider pulse with no network.
Validate the rider pulse with poor GPS accuracy.
Validate the rider pulse with rapidly changing telemetry.
Validate the rider pulse with accessibility text scaling.
Validate the rider pulse with reduced motion.
Validate the rider pulse with keyboard navigation where applicable.
Validate the rider pulse with screen readers for non-driving planning contexts.
Validate the rider pulse with touch and pointer input.
Validate the rider pulse with glove-friendly target sizing.
Document every interactive state of the rider pulse.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the rider pulse.
Create a reusable component contract for the rider pulse.
Keep component APIs semantic rather than visual-only for the rider pulse.
Separate data state from presentation state in the rider pulse.
Keep animation state separate from business state in the rider pulse.
Avoid hardcoding user-specific values into the rider pulse.
Drive rider pulse values from the application's data layer.
Keep the rider pulse resilient to missing optional data.
Keep the rider pulse deterministic during replay or ride-history inspection.
Use consistent time formatting across the rider pulse.
Use consistent distance formatting across the rider pulse.
Use consistent rider status terminology across the rider pulse.
Use consistent alert severity terminology across the rider pulse.
Use consistent route terminology across the rider pulse.
Use consistent checkpoint terminology across the rider pulse.
Use consistent connection terminology across the rider pulse.
Do not introduce a new visual pattern for the rider pulse if an existing pattern already solves the same problem.
Prefer composition over component nesting in the rider pulse.
Keep the visual surface of the rider pulse calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary rider pulse information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the rider pulse.
Use the reference HMI's instrument-panel logic as inspiration for the rider pulse.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the rider pulse feel native to Rideclub's spatial operating-system concept.
The final rider pulse must not look like a generic admin dashboard.
The final rider pulse must not look like a generic fintech dashboard.
The final rider pulse must not look like a generic social feed.
The final rider pulse must not look like a generic navigation clone.
The final rider pulse must feel like one cohesive Rideclub cockpit.
# 18 — GROUP COHESION
Define the group cohesion as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the group cohesion benefits from geographic awareness.
Use a restrained near-black foundation behind the group cohesion.
Use #F4F7FA for primary readable values in the group cohesion.
Use #AAB1BD for supporting labels in the group cohesion.
Use #66707D for low-priority metadata in the group cohesion.
Use #FF4D21 only for Rideclub-primary actions in the group cohesion.
Use cyan for live communication state when applicable to the group cohesion.
Use green for successful or healthy state when applicable to the group cohesion.
Use amber for caution state when applicable to the group cohesion.
Use red only for critical state when applicable to the group cohesion.
Use technical typography for telemetry values associated with the group cohesion.
Use human-readable typography for rider-facing copy associated with the group cohesion.
Avoid unnecessary rounded rectangles in the group cohesion.
Avoid placing every datum inside its own container in the group cohesion.
Use one-pixel structural rules when the group cohesion needs visual grouping.
Use negative space as the first grouping mechanism in the group cohesion.
Use radial geometry when the group cohesion represents a measurable quantity.
Use nodes when the group cohesion represents people or geographic entities.
Use lines when the group cohesion represents a relationship or sequence.
Use rings when the group cohesion represents progress, cohesion, or capacity.
Use large numerals when the group cohesion contains a primary metric.
Use compact labels when the group cohesion contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive group cohesion controls.
Provide a larger sixty-four-pixel interaction zone for the most important group cohesion action during riding.
Do not require precise tapping for critical group cohesion actions.
Use hold-to-confirm for irreversible or safety-sensitive group cohesion actions where appropriate.
Provide immediate visual feedback for every interactive group cohesion action.
Animate the group cohesion only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the group cohesion.
Use sixty-to-two-hundred-fifty millisecond transitions for normal group cohesion UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the group cohesion.
Use opacity changes to establish secondary hierarchy in the group cohesion.
Use scale changes sparingly in the group cohesion.
Avoid large bounce animations in the group cohesion.
Use subtle glow to indicate active state in the group cohesion.
Never use glow as the only indicator of an important group cohesion state.
Pair important group cohesion states with text, iconography, or geometry.
Preserve the visual hierarchy of the group cohesion under reduced-motion settings.
Ensure the group cohesion remains understandable without animation.
Ensure the group cohesion remains usable at high text zoom.
Ensure the group cohesion remains usable in strong outdoor light where possible.
Use high contrast between the group cohesion primary value and its background.
Do not use tiny gray text for essential group cohesion information.
Keep secondary group cohesion information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the group cohesion.
Use uppercase tracking only for short telemetry labels in the group cohesion.
Use tabular numerals for changing group cohesion values.
Keep decimal precision consistent across the group cohesion.
Use locale-aware formatting for distance and speed in the group cohesion.
Use metric units by default for the group cohesion when the user is in a metric locale.
Allow unit preferences to be changed in settings for the group cohesion.
Use safe-area insets around the group cohesion on mobile devices.
Keep important group cohesion content away from gesture navigation edges.
Support landscape orientation for riding-focused group cohesion screens.
Support portrait orientation for planning-focused group cohesion screens.
Allow the group cohesion to reorganize rather than simply shrink at smaller widths.
Do not stack every group cohesion element vertically on mobile.
Use edge rails for compact group cohesion telemetry on narrow screens.
Use bottom sheets only when the group cohesion needs temporary detailed interaction.
Avoid permanent bottom sheets for the group cohesion unless the screen is specifically designed around one.
Keep map gestures available whenever the group cohesion does not require modal focus.
Prevent accidental map gestures while interacting with critical group cohesion controls.
Use pointer-events layering intentionally for the group cohesion.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the group cohesion.
Use MapLibre layers for geographic information whenever possible for the group cohesion.
Use DOM overlays only for interaction-heavy group cohesion controls.
Keep route geometry visually dominant over secondary map labels in the group cohesion.
Dim irrelevant map detail behind active group cohesion guidance.
Use a clear active route line for the group cohesion.
Use a thinner inactive route line for alternate group cohesion paths.
Use checkpoint nodes to divide long group cohesion journeys into understandable segments.
Use start and destination markers consistently in the group cohesion.
Use directional orientation for moving rider markers in the group cohesion.
Avoid using generic pins for every group cohesion object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the group cohesion.
Use clustering when many group cohesion entities overlap.
Use expansion behavior when a group cohesion cluster is selected.
Use proximity to determine emphasis for nearby group cohesion entities.
Use distance labels only when distance is actionable for the group cohesion.
Use live state indicators for connected group cohesion entities.
Use stale-state indicators when group cohesion data has not updated recently.
Never imply live group cohesion data when the network is offline.
Clearly communicate offline state within the group cohesion.
Use cached data gracefully for the group cohesion.
Design the group cohesion to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the group cohesion.
Show network state without turning the group cohesion into a diagnostic screen.
Keep system diagnostics secondary to the group cohesion user goal.
Use haptic-ready interaction semantics for the group cohesion where supported.
Use sound-ready states for the group cohesion where auditory feedback is useful.
Do not make sound the only indication of a critical group cohesion state.
Use clear visual acknowledgment after the group cohesion receives an action.
Use optimistic feedback only when the group cohesion action can safely be reversed.
Use progress indicators for long-running group cohesion operations.
Use skeletons only when they help preserve the group cohesion layout.
Avoid generic spinner-only loading states for major group cohesion screens.
Provide purposeful empty states for the group cohesion.
Provide recovery actions for group cohesion errors.
Keep error messages concise and actionable in the group cohesion.
Use a technical but human tone for group cohesion system messages.
Never use jargon that the rider cannot understand in the group cohesion.
Keep safety-critical copy direct and unambiguous in the group cohesion.
Validate the group cohesion at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the group cohesion at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the group cohesion in both portrait and landscape layouts.
Validate the group cohesion with long rider names.
Validate the group cohesion with long route names.
Validate the group cohesion with zero riders.
Validate the group cohesion with one rider.
Validate the group cohesion with a full group.
Validate the group cohesion with slow network conditions.
Validate the group cohesion with no network.
Validate the group cohesion with poor GPS accuracy.
Validate the group cohesion with rapidly changing telemetry.
Validate the group cohesion with accessibility text scaling.
Validate the group cohesion with reduced motion.
Validate the group cohesion with keyboard navigation where applicable.
Validate the group cohesion with screen readers for non-driving planning contexts.
Validate the group cohesion with touch and pointer input.
Validate the group cohesion with glove-friendly target sizing.
Document every interactive state of the group cohesion.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the group cohesion.
Create a reusable component contract for the group cohesion.
Keep component APIs semantic rather than visual-only for the group cohesion.
Separate data state from presentation state in the group cohesion.
Keep animation state separate from business state in the group cohesion.
Avoid hardcoding user-specific values into the group cohesion.
Drive group cohesion values from the application's data layer.
Keep the group cohesion resilient to missing optional data.
Keep the group cohesion deterministic during replay or ride-history inspection.
Use consistent time formatting across the group cohesion.
Use consistent distance formatting across the group cohesion.
Use consistent rider status terminology across the group cohesion.
Use consistent alert severity terminology across the group cohesion.
Use consistent route terminology across the group cohesion.
Use consistent checkpoint terminology across the group cohesion.
Use consistent connection terminology across the group cohesion.
Do not introduce a new visual pattern for the group cohesion if an existing pattern already solves the same problem.
Prefer composition over component nesting in the group cohesion.
Keep the visual surface of the group cohesion calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary group cohesion information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the group cohesion.
Use the reference HMI's instrument-panel logic as inspiration for the group cohesion.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the group cohesion feel native to Rideclub's spatial operating-system concept.
The final group cohesion must not look like a generic admin dashboard.
The final group cohesion must not look like a generic fintech dashboard.
The final group cohesion must not look like a generic social feed.
The final group cohesion must not look like a generic navigation clone.
The final group cohesion must feel like one cohesive Rideclub cockpit.
# 19 — RIDER SEPARATION
Define the rider separation as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the rider separation benefits from geographic awareness.
Use a restrained near-black foundation behind the rider separation.
Use #F4F7FA for primary readable values in the rider separation.
Use #AAB1BD for supporting labels in the rider separation.
Use #66707D for low-priority metadata in the rider separation.
Use #FF4D21 only for Rideclub-primary actions in the rider separation.
Use cyan for live communication state when applicable to the rider separation.
Use green for successful or healthy state when applicable to the rider separation.
Use amber for caution state when applicable to the rider separation.
Use red only for critical state when applicable to the rider separation.
Use technical typography for telemetry values associated with the rider separation.
Use human-readable typography for rider-facing copy associated with the rider separation.
Avoid unnecessary rounded rectangles in the rider separation.
Avoid placing every datum inside its own container in the rider separation.
Use one-pixel structural rules when the rider separation needs visual grouping.
Use negative space as the first grouping mechanism in the rider separation.
Use radial geometry when the rider separation represents a measurable quantity.
Use nodes when the rider separation represents people or geographic entities.
Use lines when the rider separation represents a relationship or sequence.
Use rings when the rider separation represents progress, cohesion, or capacity.
Use large numerals when the rider separation contains a primary metric.
Use compact labels when the rider separation contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive rider separation controls.
Provide a larger sixty-four-pixel interaction zone for the most important rider separation action during riding.
Do not require precise tapping for critical rider separation actions.
Use hold-to-confirm for irreversible or safety-sensitive rider separation actions where appropriate.
Provide immediate visual feedback for every interactive rider separation action.
Animate the rider separation only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the rider separation.
Use sixty-to-two-hundred-fifty millisecond transitions for normal rider separation UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the rider separation.
Use opacity changes to establish secondary hierarchy in the rider separation.
Use scale changes sparingly in the rider separation.
Avoid large bounce animations in the rider separation.
Use subtle glow to indicate active state in the rider separation.
Never use glow as the only indicator of an important rider separation state.
Pair important rider separation states with text, iconography, or geometry.
Preserve the visual hierarchy of the rider separation under reduced-motion settings.
Ensure the rider separation remains understandable without animation.
Ensure the rider separation remains usable at high text zoom.
Ensure the rider separation remains usable in strong outdoor light where possible.
Use high contrast between the rider separation primary value and its background.
Do not use tiny gray text for essential rider separation information.
Keep secondary rider separation information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the rider separation.
Use uppercase tracking only for short telemetry labels in the rider separation.
Use tabular numerals for changing rider separation values.
Keep decimal precision consistent across the rider separation.
Use locale-aware formatting for distance and speed in the rider separation.
Use metric units by default for the rider separation when the user is in a metric locale.
Allow unit preferences to be changed in settings for the rider separation.
Use safe-area insets around the rider separation on mobile devices.
Keep important rider separation content away from gesture navigation edges.
Support landscape orientation for riding-focused rider separation screens.
Support portrait orientation for planning-focused rider separation screens.
Allow the rider separation to reorganize rather than simply shrink at smaller widths.
Do not stack every rider separation element vertically on mobile.
Use edge rails for compact rider separation telemetry on narrow screens.
Use bottom sheets only when the rider separation needs temporary detailed interaction.
Avoid permanent bottom sheets for the rider separation unless the screen is specifically designed around one.
Keep map gestures available whenever the rider separation does not require modal focus.
Prevent accidental map gestures while interacting with critical rider separation controls.
Use pointer-events layering intentionally for the rider separation.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the rider separation.
Use MapLibre layers for geographic information whenever possible for the rider separation.
Use DOM overlays only for interaction-heavy rider separation controls.
Keep route geometry visually dominant over secondary map labels in the rider separation.
Dim irrelevant map detail behind active rider separation guidance.
Use a clear active route line for the rider separation.
Use a thinner inactive route line for alternate rider separation paths.
Use checkpoint nodes to divide long rider separation journeys into understandable segments.
Use start and destination markers consistently in the rider separation.
Use directional orientation for moving rider markers in the rider separation.
Avoid using generic pins for every rider separation object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the rider separation.
Use clustering when many rider separation entities overlap.
Use expansion behavior when a rider separation cluster is selected.
Use proximity to determine emphasis for nearby rider separation entities.
Use distance labels only when distance is actionable for the rider separation.
Use live state indicators for connected rider separation entities.
Use stale-state indicators when rider separation data has not updated recently.
Never imply live rider separation data when the network is offline.
Clearly communicate offline state within the rider separation.
Use cached data gracefully for the rider separation.
Design the rider separation to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the rider separation.
Show network state without turning the rider separation into a diagnostic screen.
Keep system diagnostics secondary to the rider separation user goal.
Use haptic-ready interaction semantics for the rider separation where supported.
Use sound-ready states for the rider separation where auditory feedback is useful.
Do not make sound the only indication of a critical rider separation state.
Use clear visual acknowledgment after the rider separation receives an action.
Use optimistic feedback only when the rider separation action can safely be reversed.
Use progress indicators for long-running rider separation operations.
Use skeletons only when they help preserve the rider separation layout.
Avoid generic spinner-only loading states for major rider separation screens.
Provide purposeful empty states for the rider separation.
Provide recovery actions for rider separation errors.
Keep error messages concise and actionable in the rider separation.
Use a technical but human tone for rider separation system messages.
Never use jargon that the rider cannot understand in the rider separation.
Keep safety-critical copy direct and unambiguous in the rider separation.
Validate the rider separation at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the rider separation at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the rider separation in both portrait and landscape layouts.
Validate the rider separation with long rider names.
Validate the rider separation with long route names.
Validate the rider separation with zero riders.
Validate the rider separation with one rider.
Validate the rider separation with a full group.
Validate the rider separation with slow network conditions.
Validate the rider separation with no network.
Validate the rider separation with poor GPS accuracy.
Validate the rider separation with rapidly changing telemetry.
Validate the rider separation with accessibility text scaling.
Validate the rider separation with reduced motion.
Validate the rider separation with keyboard navigation where applicable.
Validate the rider separation with screen readers for non-driving planning contexts.
Validate the rider separation with touch and pointer input.
Validate the rider separation with glove-friendly target sizing.
Document every interactive state of the rider separation.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the rider separation.
Create a reusable component contract for the rider separation.
Keep component APIs semantic rather than visual-only for the rider separation.
Separate data state from presentation state in the rider separation.
Keep animation state separate from business state in the rider separation.
Avoid hardcoding user-specific values into the rider separation.
Drive rider separation values from the application's data layer.
Keep the rider separation resilient to missing optional data.
Keep the rider separation deterministic during replay or ride-history inspection.
Use consistent time formatting across the rider separation.
Use consistent distance formatting across the rider separation.
Use consistent rider status terminology across the rider separation.
Use consistent alert severity terminology across the rider separation.
Use consistent route terminology across the rider separation.
Use consistent checkpoint terminology across the rider separation.
Use consistent connection terminology across the rider separation.
Do not introduce a new visual pattern for the rider separation if an existing pattern already solves the same problem.
Prefer composition over component nesting in the rider separation.
Keep the visual surface of the rider separation calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary rider separation information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the rider separation.
Use the reference HMI's instrument-panel logic as inspiration for the rider separation.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the rider separation feel native to Rideclub's spatial operating-system concept.
The final rider separation must not look like a generic admin dashboard.
The final rider separation must not look like a generic fintech dashboard.
The final rider separation must not look like a generic social feed.
The final rider separation must not look like a generic navigation clone.
The final rider separation must feel like one cohesive Rideclub cockpit.
# 20 — RIDE RADAR
Define the ride radar as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the ride radar benefits from geographic awareness.
Use a restrained near-black foundation behind the ride radar.
Use #F4F7FA for primary readable values in the ride radar.
Use #AAB1BD for supporting labels in the ride radar.
Use #66707D for low-priority metadata in the ride radar.
Use #FF4D21 only for Rideclub-primary actions in the ride radar.
Use cyan for live communication state when applicable to the ride radar.
Use green for successful or healthy state when applicable to the ride radar.
Use amber for caution state when applicable to the ride radar.
Use red only for critical state when applicable to the ride radar.
Use technical typography for telemetry values associated with the ride radar.
Use human-readable typography for rider-facing copy associated with the ride radar.
Avoid unnecessary rounded rectangles in the ride radar.
Avoid placing every datum inside its own container in the ride radar.
Use one-pixel structural rules when the ride radar needs visual grouping.
Use negative space as the first grouping mechanism in the ride radar.
Use radial geometry when the ride radar represents a measurable quantity.
Use nodes when the ride radar represents people or geographic entities.
Use lines when the ride radar represents a relationship or sequence.
Use rings when the ride radar represents progress, cohesion, or capacity.
Use large numerals when the ride radar contains a primary metric.
Use compact labels when the ride radar contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive ride radar controls.
Provide a larger sixty-four-pixel interaction zone for the most important ride radar action during riding.
Do not require precise tapping for critical ride radar actions.
Use hold-to-confirm for irreversible or safety-sensitive ride radar actions where appropriate.
Provide immediate visual feedback for every interactive ride radar action.
Animate the ride radar only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the ride radar.
Use sixty-to-two-hundred-fifty millisecond transitions for normal ride radar UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the ride radar.
Use opacity changes to establish secondary hierarchy in the ride radar.
Use scale changes sparingly in the ride radar.
Avoid large bounce animations in the ride radar.
Use subtle glow to indicate active state in the ride radar.
Never use glow as the only indicator of an important ride radar state.
Pair important ride radar states with text, iconography, or geometry.
Preserve the visual hierarchy of the ride radar under reduced-motion settings.
Ensure the ride radar remains understandable without animation.
Ensure the ride radar remains usable at high text zoom.
Ensure the ride radar remains usable in strong outdoor light where possible.
Use high contrast between the ride radar primary value and its background.
Do not use tiny gray text for essential ride radar information.
Keep secondary ride radar information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the ride radar.
Use uppercase tracking only for short telemetry labels in the ride radar.
Use tabular numerals for changing ride radar values.
Keep decimal precision consistent across the ride radar.
Use locale-aware formatting for distance and speed in the ride radar.
Use metric units by default for the ride radar when the user is in a metric locale.
Allow unit preferences to be changed in settings for the ride radar.
Use safe-area insets around the ride radar on mobile devices.
Keep important ride radar content away from gesture navigation edges.
Support landscape orientation for riding-focused ride radar screens.
Support portrait orientation for planning-focused ride radar screens.
Allow the ride radar to reorganize rather than simply shrink at smaller widths.
Do not stack every ride radar element vertically on mobile.
Use edge rails for compact ride radar telemetry on narrow screens.
Use bottom sheets only when the ride radar needs temporary detailed interaction.
Avoid permanent bottom sheets for the ride radar unless the screen is specifically designed around one.
Keep map gestures available whenever the ride radar does not require modal focus.
Prevent accidental map gestures while interacting with critical ride radar controls.
Use pointer-events layering intentionally for the ride radar.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the ride radar.
Use MapLibre layers for geographic information whenever possible for the ride radar.
Use DOM overlays only for interaction-heavy ride radar controls.
Keep route geometry visually dominant over secondary map labels in the ride radar.
Dim irrelevant map detail behind active ride radar guidance.
Use a clear active route line for the ride radar.
Use a thinner inactive route line for alternate ride radar paths.
Use checkpoint nodes to divide long ride radar journeys into understandable segments.
Use start and destination markers consistently in the ride radar.
Use directional orientation for moving rider markers in the ride radar.
Avoid using generic pins for every ride radar object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the ride radar.
Use clustering when many ride radar entities overlap.
Use expansion behavior when a ride radar cluster is selected.
Use proximity to determine emphasis for nearby ride radar entities.
Use distance labels only when distance is actionable for the ride radar.
Use live state indicators for connected ride radar entities.
Use stale-state indicators when ride radar data has not updated recently.
Never imply live ride radar data when the network is offline.
Clearly communicate offline state within the ride radar.
Use cached data gracefully for the ride radar.
Design the ride radar to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the ride radar.
Show network state without turning the ride radar into a diagnostic screen.
Keep system diagnostics secondary to the ride radar user goal.
Use haptic-ready interaction semantics for the ride radar where supported.
Use sound-ready states for the ride radar where auditory feedback is useful.
Do not make sound the only indication of a critical ride radar state.
Use clear visual acknowledgment after the ride radar receives an action.
Use optimistic feedback only when the ride radar action can safely be reversed.
Use progress indicators for long-running ride radar operations.
Use skeletons only when they help preserve the ride radar layout.
Avoid generic spinner-only loading states for major ride radar screens.
Provide purposeful empty states for the ride radar.
Provide recovery actions for ride radar errors.
Keep error messages concise and actionable in the ride radar.
Use a technical but human tone for ride radar system messages.
Never use jargon that the rider cannot understand in the ride radar.
Keep safety-critical copy direct and unambiguous in the ride radar.
Validate the ride radar at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the ride radar at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the ride radar in both portrait and landscape layouts.
Validate the ride radar with long rider names.
Validate the ride radar with long route names.
Validate the ride radar with zero riders.
Validate the ride radar with one rider.
Validate the ride radar with a full group.
Validate the ride radar with slow network conditions.
Validate the ride radar with no network.
Validate the ride radar with poor GPS accuracy.
Validate the ride radar with rapidly changing telemetry.
Validate the ride radar with accessibility text scaling.
Validate the ride radar with reduced motion.
Validate the ride radar with keyboard navigation where applicable.
Validate the ride radar with screen readers for non-driving planning contexts.
Validate the ride radar with touch and pointer input.
Validate the ride radar with glove-friendly target sizing.
Document every interactive state of the ride radar.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the ride radar.
Create a reusable component contract for the ride radar.
Keep component APIs semantic rather than visual-only for the ride radar.
Separate data state from presentation state in the ride radar.
Keep animation state separate from business state in the ride radar.
Avoid hardcoding user-specific values into the ride radar.
Drive ride radar values from the application's data layer.
Keep the ride radar resilient to missing optional data.
Keep the ride radar deterministic during replay or ride-history inspection.
Use consistent time formatting across the ride radar.
Use consistent distance formatting across the ride radar.
Use consistent rider status terminology across the ride radar.
Use consistent alert severity terminology across the ride radar.
Use consistent route terminology across the ride radar.
Use consistent checkpoint terminology across the ride radar.
Use consistent connection terminology across the ride radar.
Do not introduce a new visual pattern for the ride radar if an existing pattern already solves the same problem.
Prefer composition over component nesting in the ride radar.
Keep the visual surface of the ride radar calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary ride radar information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the ride radar.
Use the reference HMI's instrument-panel logic as inspiration for the ride radar.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the ride radar feel native to Rideclub's spatial operating-system concept.
The final ride radar must not look like a generic admin dashboard.
The final ride radar must not look like a generic fintech dashboard.
The final ride radar must not look like a generic social feed.
The final ride radar must not look like a generic navigation clone.
The final ride radar must feel like one cohesive Rideclub cockpit.
# 21 — PUBLIC RIDES
Define the public rides as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the public rides benefits from geographic awareness.
Use a restrained near-black foundation behind the public rides.
Use #F4F7FA for primary readable values in the public rides.
Use #AAB1BD for supporting labels in the public rides.
Use #66707D for low-priority metadata in the public rides.
Use #FF4D21 only for Rideclub-primary actions in the public rides.
Use cyan for live communication state when applicable to the public rides.
Use green for successful or healthy state when applicable to the public rides.
Use amber for caution state when applicable to the public rides.
Use red only for critical state when applicable to the public rides.
Use technical typography for telemetry values associated with the public rides.
Use human-readable typography for rider-facing copy associated with the public rides.
Avoid unnecessary rounded rectangles in the public rides.
Avoid placing every datum inside its own container in the public rides.
Use one-pixel structural rules when the public rides needs visual grouping.
Use negative space as the first grouping mechanism in the public rides.
Use radial geometry when the public rides represents a measurable quantity.
Use nodes when the public rides represents people or geographic entities.
Use lines when the public rides represents a relationship or sequence.
Use rings when the public rides represents progress, cohesion, or capacity.
Use large numerals when the public rides contains a primary metric.
Use compact labels when the public rides contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive public rides controls.
Provide a larger sixty-four-pixel interaction zone for the most important public rides action during riding.
Do not require precise tapping for critical public rides actions.
Use hold-to-confirm for irreversible or safety-sensitive public rides actions where appropriate.
Provide immediate visual feedback for every interactive public rides action.
Animate the public rides only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the public rides.
Use sixty-to-two-hundred-fifty millisecond transitions for normal public rides UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the public rides.
Use opacity changes to establish secondary hierarchy in the public rides.
Use scale changes sparingly in the public rides.
Avoid large bounce animations in the public rides.
Use subtle glow to indicate active state in the public rides.
Never use glow as the only indicator of an important public rides state.
Pair important public rides states with text, iconography, or geometry.
Preserve the visual hierarchy of the public rides under reduced-motion settings.
Ensure the public rides remains understandable without animation.
Ensure the public rides remains usable at high text zoom.
Ensure the public rides remains usable in strong outdoor light where possible.
Use high contrast between the public rides primary value and its background.
Do not use tiny gray text for essential public rides information.
Keep secondary public rides information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the public rides.
Use uppercase tracking only for short telemetry labels in the public rides.
Use tabular numerals for changing public rides values.
Keep decimal precision consistent across the public rides.
Use locale-aware formatting for distance and speed in the public rides.
Use metric units by default for the public rides when the user is in a metric locale.
Allow unit preferences to be changed in settings for the public rides.
Use safe-area insets around the public rides on mobile devices.
Keep important public rides content away from gesture navigation edges.
Support landscape orientation for riding-focused public rides screens.
Support portrait orientation for planning-focused public rides screens.
Allow the public rides to reorganize rather than simply shrink at smaller widths.
Do not stack every public rides element vertically on mobile.
Use edge rails for compact public rides telemetry on narrow screens.
Use bottom sheets only when the public rides needs temporary detailed interaction.
Avoid permanent bottom sheets for the public rides unless the screen is specifically designed around one.
Keep map gestures available whenever the public rides does not require modal focus.
Prevent accidental map gestures while interacting with critical public rides controls.
Use pointer-events layering intentionally for the public rides.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the public rides.
Use MapLibre layers for geographic information whenever possible for the public rides.
Use DOM overlays only for interaction-heavy public rides controls.
Keep route geometry visually dominant over secondary map labels in the public rides.
Dim irrelevant map detail behind active public rides guidance.
Use a clear active route line for the public rides.
Use a thinner inactive route line for alternate public rides paths.
Use checkpoint nodes to divide long public rides journeys into understandable segments.
Use start and destination markers consistently in the public rides.
Use directional orientation for moving rider markers in the public rides.
Avoid using generic pins for every public rides object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the public rides.
Use clustering when many public rides entities overlap.
Use expansion behavior when a public rides cluster is selected.
Use proximity to determine emphasis for nearby public rides entities.
Use distance labels only when distance is actionable for the public rides.
Use live state indicators for connected public rides entities.
Use stale-state indicators when public rides data has not updated recently.
Never imply live public rides data when the network is offline.
Clearly communicate offline state within the public rides.
Use cached data gracefully for the public rides.
Design the public rides to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the public rides.
Show network state without turning the public rides into a diagnostic screen.
Keep system diagnostics secondary to the public rides user goal.
Use haptic-ready interaction semantics for the public rides where supported.
Use sound-ready states for the public rides where auditory feedback is useful.
Do not make sound the only indication of a critical public rides state.
Use clear visual acknowledgment after the public rides receives an action.
Use optimistic feedback only when the public rides action can safely be reversed.
Use progress indicators for long-running public rides operations.
Use skeletons only when they help preserve the public rides layout.
Avoid generic spinner-only loading states for major public rides screens.
Provide purposeful empty states for the public rides.
Provide recovery actions for public rides errors.
Keep error messages concise and actionable in the public rides.
Use a technical but human tone for public rides system messages.
Never use jargon that the rider cannot understand in the public rides.
Keep safety-critical copy direct and unambiguous in the public rides.
Validate the public rides at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the public rides at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the public rides in both portrait and landscape layouts.
Validate the public rides with long rider names.
Validate the public rides with long route names.
Validate the public rides with zero riders.
Validate the public rides with one rider.
Validate the public rides with a full group.
Validate the public rides with slow network conditions.
Validate the public rides with no network.
Validate the public rides with poor GPS accuracy.
Validate the public rides with rapidly changing telemetry.
Validate the public rides with accessibility text scaling.
Validate the public rides with reduced motion.
Validate the public rides with keyboard navigation where applicable.
Validate the public rides with screen readers for non-driving planning contexts.
Validate the public rides with touch and pointer input.
Validate the public rides with glove-friendly target sizing.
Document every interactive state of the public rides.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the public rides.
Create a reusable component contract for the public rides.
Keep component APIs semantic rather than visual-only for the public rides.
Separate data state from presentation state in the public rides.
Keep animation state separate from business state in the public rides.
Avoid hardcoding user-specific values into the public rides.
Drive public rides values from the application's data layer.
Keep the public rides resilient to missing optional data.
Keep the public rides deterministic during replay or ride-history inspection.
Use consistent time formatting across the public rides.
Use consistent distance formatting across the public rides.
Use consistent rider status terminology across the public rides.
Use consistent alert severity terminology across the public rides.
Use consistent route terminology across the public rides.
Use consistent checkpoint terminology across the public rides.
Use consistent connection terminology across the public rides.
Do not introduce a new visual pattern for the public rides if an existing pattern already solves the same problem.
Prefer composition over component nesting in the public rides.
Keep the visual surface of the public rides calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary public rides information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the public rides.
Use the reference HMI's instrument-panel logic as inspiration for the public rides.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the public rides feel native to Rideclub's spatial operating-system concept.
The final public rides must not look like a generic admin dashboard.
The final public rides must not look like a generic fintech dashboard.
The final public rides must not look like a generic social feed.
The final public rides must not look like a generic navigation clone.
The final public rides must feel like one cohesive Rideclub cockpit.
# 22 — RIDE DISCOVERY
Define the ride discovery as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the ride discovery benefits from geographic awareness.
Use a restrained near-black foundation behind the ride discovery.
Use #F4F7FA for primary readable values in the ride discovery.
Use #AAB1BD for supporting labels in the ride discovery.
Use #66707D for low-priority metadata in the ride discovery.
Use #FF4D21 only for Rideclub-primary actions in the ride discovery.
Use cyan for live communication state when applicable to the ride discovery.
Use green for successful or healthy state when applicable to the ride discovery.
Use amber for caution state when applicable to the ride discovery.
Use red only for critical state when applicable to the ride discovery.
Use technical typography for telemetry values associated with the ride discovery.
Use human-readable typography for rider-facing copy associated with the ride discovery.
Avoid unnecessary rounded rectangles in the ride discovery.
Avoid placing every datum inside its own container in the ride discovery.
Use one-pixel structural rules when the ride discovery needs visual grouping.
Use negative space as the first grouping mechanism in the ride discovery.
Use radial geometry when the ride discovery represents a measurable quantity.
Use nodes when the ride discovery represents people or geographic entities.
Use lines when the ride discovery represents a relationship or sequence.
Use rings when the ride discovery represents progress, cohesion, or capacity.
Use large numerals when the ride discovery contains a primary metric.
Use compact labels when the ride discovery contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive ride discovery controls.
Provide a larger sixty-four-pixel interaction zone for the most important ride discovery action during riding.
Do not require precise tapping for critical ride discovery actions.
Use hold-to-confirm for irreversible or safety-sensitive ride discovery actions where appropriate.
Provide immediate visual feedback for every interactive ride discovery action.
Animate the ride discovery only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the ride discovery.
Use sixty-to-two-hundred-fifty millisecond transitions for normal ride discovery UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the ride discovery.
Use opacity changes to establish secondary hierarchy in the ride discovery.
Use scale changes sparingly in the ride discovery.
Avoid large bounce animations in the ride discovery.
Use subtle glow to indicate active state in the ride discovery.
Never use glow as the only indicator of an important ride discovery state.
Pair important ride discovery states with text, iconography, or geometry.
Preserve the visual hierarchy of the ride discovery under reduced-motion settings.
Ensure the ride discovery remains understandable without animation.
Ensure the ride discovery remains usable at high text zoom.
Ensure the ride discovery remains usable in strong outdoor light where possible.
Use high contrast between the ride discovery primary value and its background.
Do not use tiny gray text for essential ride discovery information.
Keep secondary ride discovery information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the ride discovery.
Use uppercase tracking only for short telemetry labels in the ride discovery.
Use tabular numerals for changing ride discovery values.
Keep decimal precision consistent across the ride discovery.
Use locale-aware formatting for distance and speed in the ride discovery.
Use metric units by default for the ride discovery when the user is in a metric locale.
Allow unit preferences to be changed in settings for the ride discovery.
Use safe-area insets around the ride discovery on mobile devices.
Keep important ride discovery content away from gesture navigation edges.
Support landscape orientation for riding-focused ride discovery screens.
Support portrait orientation for planning-focused ride discovery screens.
Allow the ride discovery to reorganize rather than simply shrink at smaller widths.
Do not stack every ride discovery element vertically on mobile.
Use edge rails for compact ride discovery telemetry on narrow screens.
Use bottom sheets only when the ride discovery needs temporary detailed interaction.
Avoid permanent bottom sheets for the ride discovery unless the screen is specifically designed around one.
Keep map gestures available whenever the ride discovery does not require modal focus.
Prevent accidental map gestures while interacting with critical ride discovery controls.
Use pointer-events layering intentionally for the ride discovery.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the ride discovery.
Use MapLibre layers for geographic information whenever possible for the ride discovery.
Use DOM overlays only for interaction-heavy ride discovery controls.
Keep route geometry visually dominant over secondary map labels in the ride discovery.
Dim irrelevant map detail behind active ride discovery guidance.
Use a clear active route line for the ride discovery.
Use a thinner inactive route line for alternate ride discovery paths.
Use checkpoint nodes to divide long ride discovery journeys into understandable segments.
Use start and destination markers consistently in the ride discovery.
Use directional orientation for moving rider markers in the ride discovery.
Avoid using generic pins for every ride discovery object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the ride discovery.
Use clustering when many ride discovery entities overlap.
Use expansion behavior when a ride discovery cluster is selected.
Use proximity to determine emphasis for nearby ride discovery entities.
Use distance labels only when distance is actionable for the ride discovery.
Use live state indicators for connected ride discovery entities.
Use stale-state indicators when ride discovery data has not updated recently.
Never imply live ride discovery data when the network is offline.
Clearly communicate offline state within the ride discovery.
Use cached data gracefully for the ride discovery.
Design the ride discovery to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the ride discovery.
Show network state without turning the ride discovery into a diagnostic screen.
Keep system diagnostics secondary to the ride discovery user goal.
Use haptic-ready interaction semantics for the ride discovery where supported.
Use sound-ready states for the ride discovery where auditory feedback is useful.
Do not make sound the only indication of a critical ride discovery state.
Use clear visual acknowledgment after the ride discovery receives an action.
Use optimistic feedback only when the ride discovery action can safely be reversed.
Use progress indicators for long-running ride discovery operations.
Use skeletons only when they help preserve the ride discovery layout.
Avoid generic spinner-only loading states for major ride discovery screens.
Provide purposeful empty states for the ride discovery.
Provide recovery actions for ride discovery errors.
Keep error messages concise and actionable in the ride discovery.
Use a technical but human tone for ride discovery system messages.
Never use jargon that the rider cannot understand in the ride discovery.
Keep safety-critical copy direct and unambiguous in the ride discovery.
Validate the ride discovery at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the ride discovery at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the ride discovery in both portrait and landscape layouts.
Validate the ride discovery with long rider names.
Validate the ride discovery with long route names.
Validate the ride discovery with zero riders.
Validate the ride discovery with one rider.
Validate the ride discovery with a full group.
Validate the ride discovery with slow network conditions.
Validate the ride discovery with no network.
Validate the ride discovery with poor GPS accuracy.
Validate the ride discovery with rapidly changing telemetry.
Validate the ride discovery with accessibility text scaling.
Validate the ride discovery with reduced motion.
Validate the ride discovery with keyboard navigation where applicable.
Validate the ride discovery with screen readers for non-driving planning contexts.
Validate the ride discovery with touch and pointer input.
Validate the ride discovery with glove-friendly target sizing.
Document every interactive state of the ride discovery.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the ride discovery.
Create a reusable component contract for the ride discovery.
Keep component APIs semantic rather than visual-only for the ride discovery.
Separate data state from presentation state in the ride discovery.
Keep animation state separate from business state in the ride discovery.
Avoid hardcoding user-specific values into the ride discovery.
Drive ride discovery values from the application's data layer.
Keep the ride discovery resilient to missing optional data.
Keep the ride discovery deterministic during replay or ride-history inspection.
Use consistent time formatting across the ride discovery.
Use consistent distance formatting across the ride discovery.
Use consistent rider status terminology across the ride discovery.
Use consistent alert severity terminology across the ride discovery.
Use consistent route terminology across the ride discovery.
Use consistent checkpoint terminology across the ride discovery.
Use consistent connection terminology across the ride discovery.
Do not introduce a new visual pattern for the ride discovery if an existing pattern already solves the same problem.
Prefer composition over component nesting in the ride discovery.
Keep the visual surface of the ride discovery calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary ride discovery information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the ride discovery.
Use the reference HMI's instrument-panel logic as inspiration for the ride discovery.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the ride discovery feel native to Rideclub's spatial operating-system concept.
The final ride discovery must not look like a generic admin dashboard.
The final ride discovery must not look like a generic fintech dashboard.
The final ride discovery must not look like a generic social feed.
The final ride discovery must not look like a generic navigation clone.
The final ride discovery must feel like one cohesive Rideclub cockpit.
# 23 — CREATE RIDE
Define the create ride as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the create ride benefits from geographic awareness.
Use a restrained near-black foundation behind the create ride.
Use #F4F7FA for primary readable values in the create ride.
Use #AAB1BD for supporting labels in the create ride.
Use #66707D for low-priority metadata in the create ride.
Use #FF4D21 only for Rideclub-primary actions in the create ride.
Use cyan for live communication state when applicable to the create ride.
Use green for successful or healthy state when applicable to the create ride.
Use amber for caution state when applicable to the create ride.
Use red only for critical state when applicable to the create ride.
Use technical typography for telemetry values associated with the create ride.
Use human-readable typography for rider-facing copy associated with the create ride.
Avoid unnecessary rounded rectangles in the create ride.
Avoid placing every datum inside its own container in the create ride.
Use one-pixel structural rules when the create ride needs visual grouping.
Use negative space as the first grouping mechanism in the create ride.
Use radial geometry when the create ride represents a measurable quantity.
Use nodes when the create ride represents people or geographic entities.
Use lines when the create ride represents a relationship or sequence.
Use rings when the create ride represents progress, cohesion, or capacity.
Use large numerals when the create ride contains a primary metric.
Use compact labels when the create ride contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive create ride controls.
Provide a larger sixty-four-pixel interaction zone for the most important create ride action during riding.
Do not require precise tapping for critical create ride actions.
Use hold-to-confirm for irreversible or safety-sensitive create ride actions where appropriate.
Provide immediate visual feedback for every interactive create ride action.
Animate the create ride only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the create ride.
Use sixty-to-two-hundred-fifty millisecond transitions for normal create ride UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the create ride.
Use opacity changes to establish secondary hierarchy in the create ride.
Use scale changes sparingly in the create ride.
Avoid large bounce animations in the create ride.
Use subtle glow to indicate active state in the create ride.
Never use glow as the only indicator of an important create ride state.
Pair important create ride states with text, iconography, or geometry.
Preserve the visual hierarchy of the create ride under reduced-motion settings.
Ensure the create ride remains understandable without animation.
Ensure the create ride remains usable at high text zoom.
Ensure the create ride remains usable in strong outdoor light where possible.
Use high contrast between the create ride primary value and its background.
Do not use tiny gray text for essential create ride information.
Keep secondary create ride information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the create ride.
Use uppercase tracking only for short telemetry labels in the create ride.
Use tabular numerals for changing create ride values.
Keep decimal precision consistent across the create ride.
Use locale-aware formatting for distance and speed in the create ride.
Use metric units by default for the create ride when the user is in a metric locale.
Allow unit preferences to be changed in settings for the create ride.
Use safe-area insets around the create ride on mobile devices.
Keep important create ride content away from gesture navigation edges.
Support landscape orientation for riding-focused create ride screens.
Support portrait orientation for planning-focused create ride screens.
Allow the create ride to reorganize rather than simply shrink at smaller widths.
Do not stack every create ride element vertically on mobile.
Use edge rails for compact create ride telemetry on narrow screens.
Use bottom sheets only when the create ride needs temporary detailed interaction.
Avoid permanent bottom sheets for the create ride unless the screen is specifically designed around one.
Keep map gestures available whenever the create ride does not require modal focus.
Prevent accidental map gestures while interacting with critical create ride controls.
Use pointer-events layering intentionally for the create ride.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the create ride.
Use MapLibre layers for geographic information whenever possible for the create ride.
Use DOM overlays only for interaction-heavy create ride controls.
Keep route geometry visually dominant over secondary map labels in the create ride.
Dim irrelevant map detail behind active create ride guidance.
Use a clear active route line for the create ride.
Use a thinner inactive route line for alternate create ride paths.
Use checkpoint nodes to divide long create ride journeys into understandable segments.
Use start and destination markers consistently in the create ride.
Use directional orientation for moving rider markers in the create ride.
Avoid using generic pins for every create ride object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the create ride.
Use clustering when many create ride entities overlap.
Use expansion behavior when a create ride cluster is selected.
Use proximity to determine emphasis for nearby create ride entities.
Use distance labels only when distance is actionable for the create ride.
Use live state indicators for connected create ride entities.
Use stale-state indicators when create ride data has not updated recently.
Never imply live create ride data when the network is offline.
Clearly communicate offline state within the create ride.
Use cached data gracefully for the create ride.
Design the create ride to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the create ride.
Show network state without turning the create ride into a diagnostic screen.
Keep system diagnostics secondary to the create ride user goal.
Use haptic-ready interaction semantics for the create ride where supported.
Use sound-ready states for the create ride where auditory feedback is useful.
Do not make sound the only indication of a critical create ride state.
Use clear visual acknowledgment after the create ride receives an action.
Use optimistic feedback only when the create ride action can safely be reversed.
Use progress indicators for long-running create ride operations.
Use skeletons only when they help preserve the create ride layout.
Avoid generic spinner-only loading states for major create ride screens.
Provide purposeful empty states for the create ride.
Provide recovery actions for create ride errors.
Keep error messages concise and actionable in the create ride.
Use a technical but human tone for create ride system messages.
Never use jargon that the rider cannot understand in the create ride.
Keep safety-critical copy direct and unambiguous in the create ride.
Validate the create ride at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the create ride at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the create ride in both portrait and landscape layouts.
Validate the create ride with long rider names.
Validate the create ride with long route names.
Validate the create ride with zero riders.
Validate the create ride with one rider.
Validate the create ride with a full group.
Validate the create ride with slow network conditions.
Validate the create ride with no network.
Validate the create ride with poor GPS accuracy.
Validate the create ride with rapidly changing telemetry.
Validate the create ride with accessibility text scaling.
Validate the create ride with reduced motion.
Validate the create ride with keyboard navigation where applicable.
Validate the create ride with screen readers for non-driving planning contexts.
Validate the create ride with touch and pointer input.
Validate the create ride with glove-friendly target sizing.
Document every interactive state of the create ride.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the create ride.
Create a reusable component contract for the create ride.
Keep component APIs semantic rather than visual-only for the create ride.
Separate data state from presentation state in the create ride.
Keep animation state separate from business state in the create ride.
Avoid hardcoding user-specific values into the create ride.
Drive create ride values from the application's data layer.
Keep the create ride resilient to missing optional data.
Keep the create ride deterministic during replay or ride-history inspection.
Use consistent time formatting across the create ride.
Use consistent distance formatting across the create ride.
Use consistent rider status terminology across the create ride.
Use consistent alert severity terminology across the create ride.
Use consistent route terminology across the create ride.
Use consistent checkpoint terminology across the create ride.
Use consistent connection terminology across the create ride.
Do not introduce a new visual pattern for the create ride if an existing pattern already solves the same problem.
Prefer composition over component nesting in the create ride.
Keep the visual surface of the create ride calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary create ride information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the create ride.
Use the reference HMI's instrument-panel logic as inspiration for the create ride.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the create ride feel native to Rideclub's spatial operating-system concept.
The final create ride must not look like a generic admin dashboard.
The final create ride must not look like a generic fintech dashboard.
The final create ride must not look like a generic social feed.
The final create ride must not look like a generic navigation clone.
The final create ride must feel like one cohesive Rideclub cockpit.
# 24 — RIDE PREPARATION
Define the ride preparation as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the ride preparation benefits from geographic awareness.
Use a restrained near-black foundation behind the ride preparation.
Use #F4F7FA for primary readable values in the ride preparation.
Use #AAB1BD for supporting labels in the ride preparation.
Use #66707D for low-priority metadata in the ride preparation.
Use #FF4D21 only for Rideclub-primary actions in the ride preparation.
Use cyan for live communication state when applicable to the ride preparation.
Use green for successful or healthy state when applicable to the ride preparation.
Use amber for caution state when applicable to the ride preparation.
Use red only for critical state when applicable to the ride preparation.
Use technical typography for telemetry values associated with the ride preparation.
Use human-readable typography for rider-facing copy associated with the ride preparation.
Avoid unnecessary rounded rectangles in the ride preparation.
Avoid placing every datum inside its own container in the ride preparation.
Use one-pixel structural rules when the ride preparation needs visual grouping.
Use negative space as the first grouping mechanism in the ride preparation.
Use radial geometry when the ride preparation represents a measurable quantity.
Use nodes when the ride preparation represents people or geographic entities.
Use lines when the ride preparation represents a relationship or sequence.
Use rings when the ride preparation represents progress, cohesion, or capacity.
Use large numerals when the ride preparation contains a primary metric.
Use compact labels when the ride preparation contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive ride preparation controls.
Provide a larger sixty-four-pixel interaction zone for the most important ride preparation action during riding.
Do not require precise tapping for critical ride preparation actions.
Use hold-to-confirm for irreversible or safety-sensitive ride preparation actions where appropriate.
Provide immediate visual feedback for every interactive ride preparation action.
Animate the ride preparation only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the ride preparation.
Use sixty-to-two-hundred-fifty millisecond transitions for normal ride preparation UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the ride preparation.
Use opacity changes to establish secondary hierarchy in the ride preparation.
Use scale changes sparingly in the ride preparation.
Avoid large bounce animations in the ride preparation.
Use subtle glow to indicate active state in the ride preparation.
Never use glow as the only indicator of an important ride preparation state.
Pair important ride preparation states with text, iconography, or geometry.
Preserve the visual hierarchy of the ride preparation under reduced-motion settings.
Ensure the ride preparation remains understandable without animation.
Ensure the ride preparation remains usable at high text zoom.
Ensure the ride preparation remains usable in strong outdoor light where possible.
Use high contrast between the ride preparation primary value and its background.
Do not use tiny gray text for essential ride preparation information.
Keep secondary ride preparation information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the ride preparation.
Use uppercase tracking only for short telemetry labels in the ride preparation.
Use tabular numerals for changing ride preparation values.
Keep decimal precision consistent across the ride preparation.
Use locale-aware formatting for distance and speed in the ride preparation.
Use metric units by default for the ride preparation when the user is in a metric locale.
Allow unit preferences to be changed in settings for the ride preparation.
Use safe-area insets around the ride preparation on mobile devices.
Keep important ride preparation content away from gesture navigation edges.
Support landscape orientation for riding-focused ride preparation screens.
Support portrait orientation for planning-focused ride preparation screens.
Allow the ride preparation to reorganize rather than simply shrink at smaller widths.
Do not stack every ride preparation element vertically on mobile.
Use edge rails for compact ride preparation telemetry on narrow screens.
Use bottom sheets only when the ride preparation needs temporary detailed interaction.
Avoid permanent bottom sheets for the ride preparation unless the screen is specifically designed around one.
Keep map gestures available whenever the ride preparation does not require modal focus.
Prevent accidental map gestures while interacting with critical ride preparation controls.
Use pointer-events layering intentionally for the ride preparation.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the ride preparation.
Use MapLibre layers for geographic information whenever possible for the ride preparation.
Use DOM overlays only for interaction-heavy ride preparation controls.
Keep route geometry visually dominant over secondary map labels in the ride preparation.
Dim irrelevant map detail behind active ride preparation guidance.
Use a clear active route line for the ride preparation.
Use a thinner inactive route line for alternate ride preparation paths.
Use checkpoint nodes to divide long ride preparation journeys into understandable segments.
Use start and destination markers consistently in the ride preparation.
Use directional orientation for moving rider markers in the ride preparation.
Avoid using generic pins for every ride preparation object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the ride preparation.
Use clustering when many ride preparation entities overlap.
Use expansion behavior when a ride preparation cluster is selected.
Use proximity to determine emphasis for nearby ride preparation entities.
Use distance labels only when distance is actionable for the ride preparation.
Use live state indicators for connected ride preparation entities.
Use stale-state indicators when ride preparation data has not updated recently.
Never imply live ride preparation data when the network is offline.
Clearly communicate offline state within the ride preparation.
Use cached data gracefully for the ride preparation.
Design the ride preparation to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the ride preparation.
Show network state without turning the ride preparation into a diagnostic screen.
Keep system diagnostics secondary to the ride preparation user goal.
Use haptic-ready interaction semantics for the ride preparation where supported.
Use sound-ready states for the ride preparation where auditory feedback is useful.
Do not make sound the only indication of a critical ride preparation state.
Use clear visual acknowledgment after the ride preparation receives an action.
Use optimistic feedback only when the ride preparation action can safely be reversed.
Use progress indicators for long-running ride preparation operations.
Use skeletons only when they help preserve the ride preparation layout.
Avoid generic spinner-only loading states for major ride preparation screens.
Provide purposeful empty states for the ride preparation.
Provide recovery actions for ride preparation errors.
Keep error messages concise and actionable in the ride preparation.
Use a technical but human tone for ride preparation system messages.
Never use jargon that the rider cannot understand in the ride preparation.
Keep safety-critical copy direct and unambiguous in the ride preparation.
Validate the ride preparation at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the ride preparation at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the ride preparation in both portrait and landscape layouts.
Validate the ride preparation with long rider names.
Validate the ride preparation with long route names.
Validate the ride preparation with zero riders.
Validate the ride preparation with one rider.
Validate the ride preparation with a full group.
Validate the ride preparation with slow network conditions.
Validate the ride preparation with no network.
Validate the ride preparation with poor GPS accuracy.
Validate the ride preparation with rapidly changing telemetry.
Validate the ride preparation with accessibility text scaling.
Validate the ride preparation with reduced motion.
Validate the ride preparation with keyboard navigation where applicable.
Validate the ride preparation with screen readers for non-driving planning contexts.
Validate the ride preparation with touch and pointer input.
Validate the ride preparation with glove-friendly target sizing.
Document every interactive state of the ride preparation.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the ride preparation.
Create a reusable component contract for the ride preparation.
Keep component APIs semantic rather than visual-only for the ride preparation.
Separate data state from presentation state in the ride preparation.
Keep animation state separate from business state in the ride preparation.
Avoid hardcoding user-specific values into the ride preparation.
Drive ride preparation values from the application's data layer.
Keep the ride preparation resilient to missing optional data.
Keep the ride preparation deterministic during replay or ride-history inspection.
Use consistent time formatting across the ride preparation.
Use consistent distance formatting across the ride preparation.
Use consistent rider status terminology across the ride preparation.
Use consistent alert severity terminology across the ride preparation.
Use consistent route terminology across the ride preparation.
Use consistent checkpoint terminology across the ride preparation.
Use consistent connection terminology across the ride preparation.
Do not introduce a new visual pattern for the ride preparation if an existing pattern already solves the same problem.
Prefer composition over component nesting in the ride preparation.
Keep the visual surface of the ride preparation calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary ride preparation information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the ride preparation.
Use the reference HMI's instrument-panel logic as inspiration for the ride preparation.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the ride preparation feel native to Rideclub's spatial operating-system concept.
The final ride preparation must not look like a generic admin dashboard.
The final ride preparation must not look like a generic fintech dashboard.
The final ride preparation must not look like a generic social feed.
The final ride preparation must not look like a generic navigation clone.
The final ride preparation must feel like one cohesive Rideclub cockpit.
# 25 — RIDE START
Define the ride start as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the ride start benefits from geographic awareness.
Use a restrained near-black foundation behind the ride start.
Use #F4F7FA for primary readable values in the ride start.
Use #AAB1BD for supporting labels in the ride start.
Use #66707D for low-priority metadata in the ride start.
Use #FF4D21 only for Rideclub-primary actions in the ride start.
Use cyan for live communication state when applicable to the ride start.
Use green for successful or healthy state when applicable to the ride start.
Use amber for caution state when applicable to the ride start.
Use red only for critical state when applicable to the ride start.
Use technical typography for telemetry values associated with the ride start.
Use human-readable typography for rider-facing copy associated with the ride start.
Avoid unnecessary rounded rectangles in the ride start.
Avoid placing every datum inside its own container in the ride start.
Use one-pixel structural rules when the ride start needs visual grouping.
Use negative space as the first grouping mechanism in the ride start.
Use radial geometry when the ride start represents a measurable quantity.
Use nodes when the ride start represents people or geographic entities.
Use lines when the ride start represents a relationship or sequence.
Use rings when the ride start represents progress, cohesion, or capacity.
Use large numerals when the ride start contains a primary metric.
Use compact labels when the ride start contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive ride start controls.
Provide a larger sixty-four-pixel interaction zone for the most important ride start action during riding.
Do not require precise tapping for critical ride start actions.
Use hold-to-confirm for irreversible or safety-sensitive ride start actions where appropriate.
Provide immediate visual feedback for every interactive ride start action.
Animate the ride start only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the ride start.
Use sixty-to-two-hundred-fifty millisecond transitions for normal ride start UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the ride start.
Use opacity changes to establish secondary hierarchy in the ride start.
Use scale changes sparingly in the ride start.
Avoid large bounce animations in the ride start.
Use subtle glow to indicate active state in the ride start.
Never use glow as the only indicator of an important ride start state.
Pair important ride start states with text, iconography, or geometry.
Preserve the visual hierarchy of the ride start under reduced-motion settings.
Ensure the ride start remains understandable without animation.
Ensure the ride start remains usable at high text zoom.
Ensure the ride start remains usable in strong outdoor light where possible.
Use high contrast between the ride start primary value and its background.
Do not use tiny gray text for essential ride start information.
Keep secondary ride start information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the ride start.
Use uppercase tracking only for short telemetry labels in the ride start.
Use tabular numerals for changing ride start values.
Keep decimal precision consistent across the ride start.
Use locale-aware formatting for distance and speed in the ride start.
Use metric units by default for the ride start when the user is in a metric locale.
Allow unit preferences to be changed in settings for the ride start.
Use safe-area insets around the ride start on mobile devices.
Keep important ride start content away from gesture navigation edges.
Support landscape orientation for riding-focused ride start screens.
Support portrait orientation for planning-focused ride start screens.
Allow the ride start to reorganize rather than simply shrink at smaller widths.
Do not stack every ride start element vertically on mobile.
Use edge rails for compact ride start telemetry on narrow screens.
Use bottom sheets only when the ride start needs temporary detailed interaction.
Avoid permanent bottom sheets for the ride start unless the screen is specifically designed around one.
Keep map gestures available whenever the ride start does not require modal focus.
Prevent accidental map gestures while interacting with critical ride start controls.
Use pointer-events layering intentionally for the ride start.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the ride start.
Use MapLibre layers for geographic information whenever possible for the ride start.
Use DOM overlays only for interaction-heavy ride start controls.
Keep route geometry visually dominant over secondary map labels in the ride start.
Dim irrelevant map detail behind active ride start guidance.
Use a clear active route line for the ride start.
Use a thinner inactive route line for alternate ride start paths.
Use checkpoint nodes to divide long ride start journeys into understandable segments.
Use start and destination markers consistently in the ride start.
Use directional orientation for moving rider markers in the ride start.
Avoid using generic pins for every ride start object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the ride start.
Use clustering when many ride start entities overlap.
Use expansion behavior when a ride start cluster is selected.
Use proximity to determine emphasis for nearby ride start entities.
Use distance labels only when distance is actionable for the ride start.
Use live state indicators for connected ride start entities.
Use stale-state indicators when ride start data has not updated recently.
Never imply live ride start data when the network is offline.
Clearly communicate offline state within the ride start.
Use cached data gracefully for the ride start.
Design the ride start to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the ride start.
Show network state without turning the ride start into a diagnostic screen.
Keep system diagnostics secondary to the ride start user goal.
Use haptic-ready interaction semantics for the ride start where supported.
Use sound-ready states for the ride start where auditory feedback is useful.
Do not make sound the only indication of a critical ride start state.
Use clear visual acknowledgment after the ride start receives an action.
Use optimistic feedback only when the ride start action can safely be reversed.
Use progress indicators for long-running ride start operations.
Use skeletons only when they help preserve the ride start layout.
Avoid generic spinner-only loading states for major ride start screens.
Provide purposeful empty states for the ride start.
Provide recovery actions for ride start errors.
Keep error messages concise and actionable in the ride start.
Use a technical but human tone for ride start system messages.
Never use jargon that the rider cannot understand in the ride start.
Keep safety-critical copy direct and unambiguous in the ride start.
Validate the ride start at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the ride start at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the ride start in both portrait and landscape layouts.
Validate the ride start with long rider names.
Validate the ride start with long route names.
Validate the ride start with zero riders.
Validate the ride start with one rider.
Validate the ride start with a full group.
Validate the ride start with slow network conditions.
Validate the ride start with no network.
Validate the ride start with poor GPS accuracy.
Validate the ride start with rapidly changing telemetry.
Validate the ride start with accessibility text scaling.
Validate the ride start with reduced motion.
Validate the ride start with keyboard navigation where applicable.
Validate the ride start with screen readers for non-driving planning contexts.
Validate the ride start with touch and pointer input.
Validate the ride start with glove-friendly target sizing.
Document every interactive state of the ride start.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the ride start.
Create a reusable component contract for the ride start.
Keep component APIs semantic rather than visual-only for the ride start.
Separate data state from presentation state in the ride start.
Keep animation state separate from business state in the ride start.
Avoid hardcoding user-specific values into the ride start.
Drive ride start values from the application's data layer.
Keep the ride start resilient to missing optional data.
Keep the ride start deterministic during replay or ride-history inspection.
Use consistent time formatting across the ride start.
Use consistent distance formatting across the ride start.
Use consistent rider status terminology across the ride start.
Use consistent alert severity terminology across the ride start.
Use consistent route terminology across the ride start.
Use consistent checkpoint terminology across the ride start.
Use consistent connection terminology across the ride start.
Do not introduce a new visual pattern for the ride start if an existing pattern already solves the same problem.
Prefer composition over component nesting in the ride start.
Keep the visual surface of the ride start calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary ride start information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the ride start.
Use the reference HMI's instrument-panel logic as inspiration for the ride start.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the ride start feel native to Rideclub's spatial operating-system concept.
The final ride start must not look like a generic admin dashboard.
The final ride start must not look like a generic fintech dashboard.
The final ride start must not look like a generic social feed.
The final ride start must not look like a generic navigation clone.
The final ride start must feel like one cohesive Rideclub cockpit.
# 26 — RIDE SUMMARY
Define the ride summary as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the ride summary benefits from geographic awareness.
Use a restrained near-black foundation behind the ride summary.
Use #F4F7FA for primary readable values in the ride summary.
Use #AAB1BD for supporting labels in the ride summary.
Use #66707D for low-priority metadata in the ride summary.
Use #FF4D21 only for Rideclub-primary actions in the ride summary.
Use cyan for live communication state when applicable to the ride summary.
Use green for successful or healthy state when applicable to the ride summary.
Use amber for caution state when applicable to the ride summary.
Use red only for critical state when applicable to the ride summary.
Use technical typography for telemetry values associated with the ride summary.
Use human-readable typography for rider-facing copy associated with the ride summary.
Avoid unnecessary rounded rectangles in the ride summary.
Avoid placing every datum inside its own container in the ride summary.
Use one-pixel structural rules when the ride summary needs visual grouping.
Use negative space as the first grouping mechanism in the ride summary.
Use radial geometry when the ride summary represents a measurable quantity.
Use nodes when the ride summary represents people or geographic entities.
Use lines when the ride summary represents a relationship or sequence.
Use rings when the ride summary represents progress, cohesion, or capacity.
Use large numerals when the ride summary contains a primary metric.
Use compact labels when the ride summary contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive ride summary controls.
Provide a larger sixty-four-pixel interaction zone for the most important ride summary action during riding.
Do not require precise tapping for critical ride summary actions.
Use hold-to-confirm for irreversible or safety-sensitive ride summary actions where appropriate.
Provide immediate visual feedback for every interactive ride summary action.
Animate the ride summary only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the ride summary.
Use sixty-to-two-hundred-fifty millisecond transitions for normal ride summary UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the ride summary.
Use opacity changes to establish secondary hierarchy in the ride summary.
Use scale changes sparingly in the ride summary.
Avoid large bounce animations in the ride summary.
Use subtle glow to indicate active state in the ride summary.
Never use glow as the only indicator of an important ride summary state.
Pair important ride summary states with text, iconography, or geometry.
Preserve the visual hierarchy of the ride summary under reduced-motion settings.
Ensure the ride summary remains understandable without animation.
Ensure the ride summary remains usable at high text zoom.
Ensure the ride summary remains usable in strong outdoor light where possible.
Use high contrast between the ride summary primary value and its background.
Do not use tiny gray text for essential ride summary information.
Keep secondary ride summary information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the ride summary.
Use uppercase tracking only for short telemetry labels in the ride summary.
Use tabular numerals for changing ride summary values.
Keep decimal precision consistent across the ride summary.
Use locale-aware formatting for distance and speed in the ride summary.
Use metric units by default for the ride summary when the user is in a metric locale.
Allow unit preferences to be changed in settings for the ride summary.
Use safe-area insets around the ride summary on mobile devices.
Keep important ride summary content away from gesture navigation edges.
Support landscape orientation for riding-focused ride summary screens.
Support portrait orientation for planning-focused ride summary screens.
Allow the ride summary to reorganize rather than simply shrink at smaller widths.
Do not stack every ride summary element vertically on mobile.
Use edge rails for compact ride summary telemetry on narrow screens.
Use bottom sheets only when the ride summary needs temporary detailed interaction.
Avoid permanent bottom sheets for the ride summary unless the screen is specifically designed around one.
Keep map gestures available whenever the ride summary does not require modal focus.
Prevent accidental map gestures while interacting with critical ride summary controls.
Use pointer-events layering intentionally for the ride summary.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the ride summary.
Use MapLibre layers for geographic information whenever possible for the ride summary.
Use DOM overlays only for interaction-heavy ride summary controls.
Keep route geometry visually dominant over secondary map labels in the ride summary.
Dim irrelevant map detail behind active ride summary guidance.
Use a clear active route line for the ride summary.
Use a thinner inactive route line for alternate ride summary paths.
Use checkpoint nodes to divide long ride summary journeys into understandable segments.
Use start and destination markers consistently in the ride summary.
Use directional orientation for moving rider markers in the ride summary.
Avoid using generic pins for every ride summary object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the ride summary.
Use clustering when many ride summary entities overlap.
Use expansion behavior when a ride summary cluster is selected.
Use proximity to determine emphasis for nearby ride summary entities.
Use distance labels only when distance is actionable for the ride summary.
Use live state indicators for connected ride summary entities.
Use stale-state indicators when ride summary data has not updated recently.
Never imply live ride summary data when the network is offline.
Clearly communicate offline state within the ride summary.
Use cached data gracefully for the ride summary.
Design the ride summary to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the ride summary.
Show network state without turning the ride summary into a diagnostic screen.
Keep system diagnostics secondary to the ride summary user goal.
Use haptic-ready interaction semantics for the ride summary where supported.
Use sound-ready states for the ride summary where auditory feedback is useful.
Do not make sound the only indication of a critical ride summary state.
Use clear visual acknowledgment after the ride summary receives an action.
Use optimistic feedback only when the ride summary action can safely be reversed.
Use progress indicators for long-running ride summary operations.
Use skeletons only when they help preserve the ride summary layout.
Avoid generic spinner-only loading states for major ride summary screens.
Provide purposeful empty states for the ride summary.
Provide recovery actions for ride summary errors.
Keep error messages concise and actionable in the ride summary.
Use a technical but human tone for ride summary system messages.
Never use jargon that the rider cannot understand in the ride summary.
Keep safety-critical copy direct and unambiguous in the ride summary.
Validate the ride summary at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the ride summary at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the ride summary in both portrait and landscape layouts.
Validate the ride summary with long rider names.
Validate the ride summary with long route names.
Validate the ride summary with zero riders.
Validate the ride summary with one rider.
Validate the ride summary with a full group.
Validate the ride summary with slow network conditions.
Validate the ride summary with no network.
Validate the ride summary with poor GPS accuracy.
Validate the ride summary with rapidly changing telemetry.
Validate the ride summary with accessibility text scaling.
Validate the ride summary with reduced motion.
Validate the ride summary with keyboard navigation where applicable.
Validate the ride summary with screen readers for non-driving planning contexts.
Validate the ride summary with touch and pointer input.
Validate the ride summary with glove-friendly target sizing.
Document every interactive state of the ride summary.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the ride summary.
Create a reusable component contract for the ride summary.
Keep component APIs semantic rather than visual-only for the ride summary.
Separate data state from presentation state in the ride summary.
Keep animation state separate from business state in the ride summary.
Avoid hardcoding user-specific values into the ride summary.
Drive ride summary values from the application's data layer.
Keep the ride summary resilient to missing optional data.
Keep the ride summary deterministic during replay or ride-history inspection.
Use consistent time formatting across the ride summary.
Use consistent distance formatting across the ride summary.
Use consistent rider status terminology across the ride summary.
Use consistent alert severity terminology across the ride summary.
Use consistent route terminology across the ride summary.
Use consistent checkpoint terminology across the ride summary.
Use consistent connection terminology across the ride summary.
Do not introduce a new visual pattern for the ride summary if an existing pattern already solves the same problem.
Prefer composition over component nesting in the ride summary.
Keep the visual surface of the ride summary calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary ride summary information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the ride summary.
Use the reference HMI's instrument-panel logic as inspiration for the ride summary.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the ride summary feel native to Rideclub's spatial operating-system concept.
The final ride summary must not look like a generic admin dashboard.
The final ride summary must not look like a generic fintech dashboard.
The final ride summary must not look like a generic social feed.
The final ride summary must not look like a generic navigation clone.
The final ride summary must feel like one cohesive Rideclub cockpit.
# 27 — PROFILE COCKPIT
Define the profile as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the profile benefits from geographic awareness.
Use a restrained near-black foundation behind the profile.
Use #F4F7FA for primary readable values in the profile.
Use #AAB1BD for supporting labels in the profile.
Use #66707D for low-priority metadata in the profile.
Use #FF4D21 only for Rideclub-primary actions in the profile.
Use cyan for live communication state when applicable to the profile.
Use green for successful or healthy state when applicable to the profile.
Use amber for caution state when applicable to the profile.
Use red only for critical state when applicable to the profile.
Use technical typography for telemetry values associated with the profile.
Use human-readable typography for rider-facing copy associated with the profile.
Avoid unnecessary rounded rectangles in the profile.
Avoid placing every datum inside its own container in the profile.
Use one-pixel structural rules when the profile needs visual grouping.
Use negative space as the first grouping mechanism in the profile.
Use radial geometry when the profile represents a measurable quantity.
Use nodes when the profile represents people or geographic entities.
Use lines when the profile represents a relationship or sequence.
Use rings when the profile represents progress, cohesion, or capacity.
Use large numerals when the profile contains a primary metric.
Use compact labels when the profile contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive profile controls.
Provide a larger sixty-four-pixel interaction zone for the most important profile action during riding.
Do not require precise tapping for critical profile actions.
Use hold-to-confirm for irreversible or safety-sensitive profile actions where appropriate.
Provide immediate visual feedback for every interactive profile action.
Animate the profile only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the profile.
Use sixty-to-two-hundred-fifty millisecond transitions for normal profile UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the profile.
Use opacity changes to establish secondary hierarchy in the profile.
Use scale changes sparingly in the profile.
Avoid large bounce animations in the profile.
Use subtle glow to indicate active state in the profile.
Never use glow as the only indicator of an important profile state.
Pair important profile states with text, iconography, or geometry.
Preserve the visual hierarchy of the profile under reduced-motion settings.
Ensure the profile remains understandable without animation.
Ensure the profile remains usable at high text zoom.
Ensure the profile remains usable in strong outdoor light where possible.
Use high contrast between the profile primary value and its background.
Do not use tiny gray text for essential profile information.
Keep secondary profile information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the profile.
Use uppercase tracking only for short telemetry labels in the profile.
Use tabular numerals for changing profile values.
Keep decimal precision consistent across the profile.
Use locale-aware formatting for distance and speed in the profile.
Use metric units by default for the profile when the user is in a metric locale.
Allow unit preferences to be changed in settings for the profile.
Use safe-area insets around the profile on mobile devices.
Keep important profile content away from gesture navigation edges.
Support landscape orientation for riding-focused profile screens.
Support portrait orientation for planning-focused profile screens.
Allow the profile to reorganize rather than simply shrink at smaller widths.
Do not stack every profile element vertically on mobile.
Use edge rails for compact profile telemetry on narrow screens.
Use bottom sheets only when the profile needs temporary detailed interaction.
Avoid permanent bottom sheets for the profile unless the screen is specifically designed around one.
Keep map gestures available whenever the profile does not require modal focus.
Prevent accidental map gestures while interacting with critical profile controls.
Use pointer-events layering intentionally for the profile.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the profile.
Use MapLibre layers for geographic information whenever possible for the profile.
Use DOM overlays only for interaction-heavy profile controls.
Keep route geometry visually dominant over secondary map labels in the profile.
Dim irrelevant map detail behind active profile guidance.
Use a clear active route line for the profile.
Use a thinner inactive route line for alternate profile paths.
Use checkpoint nodes to divide long profile journeys into understandable segments.
Use start and destination markers consistently in the profile.
Use directional orientation for moving rider markers in the profile.
Avoid using generic pins for every profile object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the profile.
Use clustering when many profile entities overlap.
Use expansion behavior when a profile cluster is selected.
Use proximity to determine emphasis for nearby profile entities.
Use distance labels only when distance is actionable for the profile.
Use live state indicators for connected profile entities.
Use stale-state indicators when profile data has not updated recently.
Never imply live profile data when the network is offline.
Clearly communicate offline state within the profile.
Use cached data gracefully for the profile.
Design the profile to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the profile.
Show network state without turning the profile into a diagnostic screen.
Keep system diagnostics secondary to the profile user goal.
Use haptic-ready interaction semantics for the profile where supported.
Use sound-ready states for the profile where auditory feedback is useful.
Do not make sound the only indication of a critical profile state.
Use clear visual acknowledgment after the profile receives an action.
Use optimistic feedback only when the profile action can safely be reversed.
Use progress indicators for long-running profile operations.
Use skeletons only when they help preserve the profile layout.
Avoid generic spinner-only loading states for major profile screens.
Provide purposeful empty states for the profile.
Provide recovery actions for profile errors.
Keep error messages concise and actionable in the profile.
Use a technical but human tone for profile system messages.
Never use jargon that the rider cannot understand in the profile.
Keep safety-critical copy direct and unambiguous in the profile.
Validate the profile at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the profile at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the profile in both portrait and landscape layouts.
Validate the profile with long rider names.
Validate the profile with long route names.
Validate the profile with zero riders.
Validate the profile with one rider.
Validate the profile with a full group.
Validate the profile with slow network conditions.
Validate the profile with no network.
Validate the profile with poor GPS accuracy.
Validate the profile with rapidly changing telemetry.
Validate the profile with accessibility text scaling.
Validate the profile with reduced motion.
Validate the profile with keyboard navigation where applicable.
Validate the profile with screen readers for non-driving planning contexts.
Validate the profile with touch and pointer input.
Validate the profile with glove-friendly target sizing.
Document every interactive state of the profile.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the profile.
Create a reusable component contract for the profile.
Keep component APIs semantic rather than visual-only for the profile.
Separate data state from presentation state in the profile.
Keep animation state separate from business state in the profile.
Avoid hardcoding user-specific values into the profile.
Drive profile values from the application's data layer.
Keep the profile resilient to missing optional data.
Keep the profile deterministic during replay or ride-history inspection.
Use consistent time formatting across the profile.
Use consistent distance formatting across the profile.
Use consistent rider status terminology across the profile.
Use consistent alert severity terminology across the profile.
Use consistent route terminology across the profile.
Use consistent checkpoint terminology across the profile.
Use consistent connection terminology across the profile.
Do not introduce a new visual pattern for the profile if an existing pattern already solves the same problem.
Prefer composition over component nesting in the profile.
Keep the visual surface of the profile calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary profile information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the profile.
Use the reference HMI's instrument-panel logic as inspiration for the profile.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the profile feel native to Rideclub's spatial operating-system concept.
The final profile must not look like a generic admin dashboard.
The final profile must not look like a generic fintech dashboard.
The final profile must not look like a generic social feed.
The final profile must not look like a generic navigation clone.
The final profile must feel like one cohesive Rideclub cockpit.
# 28 — RIDER IDENTITY
Define the rider identity as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the rider identity benefits from geographic awareness.
Use a restrained near-black foundation behind the rider identity.
Use #F4F7FA for primary readable values in the rider identity.
Use #AAB1BD for supporting labels in the rider identity.
Use #66707D for low-priority metadata in the rider identity.
Use #FF4D21 only for Rideclub-primary actions in the rider identity.
Use cyan for live communication state when applicable to the rider identity.
Use green for successful or healthy state when applicable to the rider identity.
Use amber for caution state when applicable to the rider identity.
Use red only for critical state when applicable to the rider identity.
Use technical typography for telemetry values associated with the rider identity.
Use human-readable typography for rider-facing copy associated with the rider identity.
Avoid unnecessary rounded rectangles in the rider identity.
Avoid placing every datum inside its own container in the rider identity.
Use one-pixel structural rules when the rider identity needs visual grouping.
Use negative space as the first grouping mechanism in the rider identity.
Use radial geometry when the rider identity represents a measurable quantity.
Use nodes when the rider identity represents people or geographic entities.
Use lines when the rider identity represents a relationship or sequence.
Use rings when the rider identity represents progress, cohesion, or capacity.
Use large numerals when the rider identity contains a primary metric.
Use compact labels when the rider identity contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive rider identity controls.
Provide a larger sixty-four-pixel interaction zone for the most important rider identity action during riding.
Do not require precise tapping for critical rider identity actions.
Use hold-to-confirm for irreversible or safety-sensitive rider identity actions where appropriate.
Provide immediate visual feedback for every interactive rider identity action.
Animate the rider identity only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the rider identity.
Use sixty-to-two-hundred-fifty millisecond transitions for normal rider identity UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the rider identity.
Use opacity changes to establish secondary hierarchy in the rider identity.
Use scale changes sparingly in the rider identity.
Avoid large bounce animations in the rider identity.
Use subtle glow to indicate active state in the rider identity.
Never use glow as the only indicator of an important rider identity state.
Pair important rider identity states with text, iconography, or geometry.
Preserve the visual hierarchy of the rider identity under reduced-motion settings.
Ensure the rider identity remains understandable without animation.
Ensure the rider identity remains usable at high text zoom.
Ensure the rider identity remains usable in strong outdoor light where possible.
Use high contrast between the rider identity primary value and its background.
Do not use tiny gray text for essential rider identity information.
Keep secondary rider identity information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the rider identity.
Use uppercase tracking only for short telemetry labels in the rider identity.
Use tabular numerals for changing rider identity values.
Keep decimal precision consistent across the rider identity.
Use locale-aware formatting for distance and speed in the rider identity.
Use metric units by default for the rider identity when the user is in a metric locale.
Allow unit preferences to be changed in settings for the rider identity.
Use safe-area insets around the rider identity on mobile devices.
Keep important rider identity content away from gesture navigation edges.
Support landscape orientation for riding-focused rider identity screens.
Support portrait orientation for planning-focused rider identity screens.
Allow the rider identity to reorganize rather than simply shrink at smaller widths.
Do not stack every rider identity element vertically on mobile.
Use edge rails for compact rider identity telemetry on narrow screens.
Use bottom sheets only when the rider identity needs temporary detailed interaction.
Avoid permanent bottom sheets for the rider identity unless the screen is specifically designed around one.
Keep map gestures available whenever the rider identity does not require modal focus.
Prevent accidental map gestures while interacting with critical rider identity controls.
Use pointer-events layering intentionally for the rider identity.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the rider identity.
Use MapLibre layers for geographic information whenever possible for the rider identity.
Use DOM overlays only for interaction-heavy rider identity controls.
Keep route geometry visually dominant over secondary map labels in the rider identity.
Dim irrelevant map detail behind active rider identity guidance.
Use a clear active route line for the rider identity.
Use a thinner inactive route line for alternate rider identity paths.
Use checkpoint nodes to divide long rider identity journeys into understandable segments.
Use start and destination markers consistently in the rider identity.
Use directional orientation for moving rider markers in the rider identity.
Avoid using generic pins for every rider identity object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the rider identity.
Use clustering when many rider identity entities overlap.
Use expansion behavior when a rider identity cluster is selected.
Use proximity to determine emphasis for nearby rider identity entities.
Use distance labels only when distance is actionable for the rider identity.
Use live state indicators for connected rider identity entities.
Use stale-state indicators when rider identity data has not updated recently.
Never imply live rider identity data when the network is offline.
Clearly communicate offline state within the rider identity.
Use cached data gracefully for the rider identity.
Design the rider identity to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the rider identity.
Show network state without turning the rider identity into a diagnostic screen.
Keep system diagnostics secondary to the rider identity user goal.
Use haptic-ready interaction semantics for the rider identity where supported.
Use sound-ready states for the rider identity where auditory feedback is useful.
Do not make sound the only indication of a critical rider identity state.
Use clear visual acknowledgment after the rider identity receives an action.
Use optimistic feedback only when the rider identity action can safely be reversed.
Use progress indicators for long-running rider identity operations.
Use skeletons only when they help preserve the rider identity layout.
Avoid generic spinner-only loading states for major rider identity screens.
Provide purposeful empty states for the rider identity.
Provide recovery actions for rider identity errors.
Keep error messages concise and actionable in the rider identity.
Use a technical but human tone for rider identity system messages.
Never use jargon that the rider cannot understand in the rider identity.
Keep safety-critical copy direct and unambiguous in the rider identity.
Validate the rider identity at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the rider identity at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the rider identity in both portrait and landscape layouts.
Validate the rider identity with long rider names.
Validate the rider identity with long route names.
Validate the rider identity with zero riders.
Validate the rider identity with one rider.
Validate the rider identity with a full group.
Validate the rider identity with slow network conditions.
Validate the rider identity with no network.
Validate the rider identity with poor GPS accuracy.
Validate the rider identity with rapidly changing telemetry.
Validate the rider identity with accessibility text scaling.
Validate the rider identity with reduced motion.
Validate the rider identity with keyboard navigation where applicable.
Validate the rider identity with screen readers for non-driving planning contexts.
Validate the rider identity with touch and pointer input.
Validate the rider identity with glove-friendly target sizing.
Document every interactive state of the rider identity.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the rider identity.
Create a reusable component contract for the rider identity.
Keep component APIs semantic rather than visual-only for the rider identity.
Separate data state from presentation state in the rider identity.
Keep animation state separate from business state in the rider identity.
Avoid hardcoding user-specific values into the rider identity.
Drive rider identity values from the application's data layer.
Keep the rider identity resilient to missing optional data.
Keep the rider identity deterministic during replay or ride-history inspection.
Use consistent time formatting across the rider identity.
Use consistent distance formatting across the rider identity.
Use consistent rider status terminology across the rider identity.
Use consistent alert severity terminology across the rider identity.
Use consistent route terminology across the rider identity.
Use consistent checkpoint terminology across the rider identity.
Use consistent connection terminology across the rider identity.
Do not introduce a new visual pattern for the rider identity if an existing pattern already solves the same problem.
Prefer composition over component nesting in the rider identity.
Keep the visual surface of the rider identity calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary rider identity information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the rider identity.
Use the reference HMI's instrument-panel logic as inspiration for the rider identity.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the rider identity feel native to Rideclub's spatial operating-system concept.
The final rider identity must not look like a generic admin dashboard.
The final rider identity must not look like a generic fintech dashboard.
The final rider identity must not look like a generic social feed.
The final rider identity must not look like a generic navigation clone.
The final rider identity must feel like one cohesive Rideclub cockpit.
# 29 — RIDE HISTORY
Define the ride history as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the ride history benefits from geographic awareness.
Use a restrained near-black foundation behind the ride history.
Use #F4F7FA for primary readable values in the ride history.
Use #AAB1BD for supporting labels in the ride history.
Use #66707D for low-priority metadata in the ride history.
Use #FF4D21 only for Rideclub-primary actions in the ride history.
Use cyan for live communication state when applicable to the ride history.
Use green for successful or healthy state when applicable to the ride history.
Use amber for caution state when applicable to the ride history.
Use red only for critical state when applicable to the ride history.
Use technical typography for telemetry values associated with the ride history.
Use human-readable typography for rider-facing copy associated with the ride history.
Avoid unnecessary rounded rectangles in the ride history.
Avoid placing every datum inside its own container in the ride history.
Use one-pixel structural rules when the ride history needs visual grouping.
Use negative space as the first grouping mechanism in the ride history.
Use radial geometry when the ride history represents a measurable quantity.
Use nodes when the ride history represents people or geographic entities.
Use lines when the ride history represents a relationship or sequence.
Use rings when the ride history represents progress, cohesion, or capacity.
Use large numerals when the ride history contains a primary metric.
Use compact labels when the ride history contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive ride history controls.
Provide a larger sixty-four-pixel interaction zone for the most important ride history action during riding.
Do not require precise tapping for critical ride history actions.
Use hold-to-confirm for irreversible or safety-sensitive ride history actions where appropriate.
Provide immediate visual feedback for every interactive ride history action.
Animate the ride history only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the ride history.
Use sixty-to-two-hundred-fifty millisecond transitions for normal ride history UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the ride history.
Use opacity changes to establish secondary hierarchy in the ride history.
Use scale changes sparingly in the ride history.
Avoid large bounce animations in the ride history.
Use subtle glow to indicate active state in the ride history.
Never use glow as the only indicator of an important ride history state.
Pair important ride history states with text, iconography, or geometry.
Preserve the visual hierarchy of the ride history under reduced-motion settings.
Ensure the ride history remains understandable without animation.
Ensure the ride history remains usable at high text zoom.
Ensure the ride history remains usable in strong outdoor light where possible.
Use high contrast between the ride history primary value and its background.
Do not use tiny gray text for essential ride history information.
Keep secondary ride history information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the ride history.
Use uppercase tracking only for short telemetry labels in the ride history.
Use tabular numerals for changing ride history values.
Keep decimal precision consistent across the ride history.
Use locale-aware formatting for distance and speed in the ride history.
Use metric units by default for the ride history when the user is in a metric locale.
Allow unit preferences to be changed in settings for the ride history.
Use safe-area insets around the ride history on mobile devices.
Keep important ride history content away from gesture navigation edges.
Support landscape orientation for riding-focused ride history screens.
Support portrait orientation for planning-focused ride history screens.
Allow the ride history to reorganize rather than simply shrink at smaller widths.
Do not stack every ride history element vertically on mobile.
Use edge rails for compact ride history telemetry on narrow screens.
Use bottom sheets only when the ride history needs temporary detailed interaction.
Avoid permanent bottom sheets for the ride history unless the screen is specifically designed around one.
Keep map gestures available whenever the ride history does not require modal focus.
Prevent accidental map gestures while interacting with critical ride history controls.
Use pointer-events layering intentionally for the ride history.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the ride history.
Use MapLibre layers for geographic information whenever possible for the ride history.
Use DOM overlays only for interaction-heavy ride history controls.
Keep route geometry visually dominant over secondary map labels in the ride history.
Dim irrelevant map detail behind active ride history guidance.
Use a clear active route line for the ride history.
Use a thinner inactive route line for alternate ride history paths.
Use checkpoint nodes to divide long ride history journeys into understandable segments.
Use start and destination markers consistently in the ride history.
Use directional orientation for moving rider markers in the ride history.
Avoid using generic pins for every ride history object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the ride history.
Use clustering when many ride history entities overlap.
Use expansion behavior when a ride history cluster is selected.
Use proximity to determine emphasis for nearby ride history entities.
Use distance labels only when distance is actionable for the ride history.
Use live state indicators for connected ride history entities.
Use stale-state indicators when ride history data has not updated recently.
Never imply live ride history data when the network is offline.
Clearly communicate offline state within the ride history.
Use cached data gracefully for the ride history.
Design the ride history to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the ride history.
Show network state without turning the ride history into a diagnostic screen.
Keep system diagnostics secondary to the ride history user goal.
Use haptic-ready interaction semantics for the ride history where supported.
Use sound-ready states for the ride history where auditory feedback is useful.
Do not make sound the only indication of a critical ride history state.
Use clear visual acknowledgment after the ride history receives an action.
Use optimistic feedback only when the ride history action can safely be reversed.
Use progress indicators for long-running ride history operations.
Use skeletons only when they help preserve the ride history layout.
Avoid generic spinner-only loading states for major ride history screens.
Provide purposeful empty states for the ride history.
Provide recovery actions for ride history errors.
Keep error messages concise and actionable in the ride history.
Use a technical but human tone for ride history system messages.
Never use jargon that the rider cannot understand in the ride history.
Keep safety-critical copy direct and unambiguous in the ride history.
Validate the ride history at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the ride history at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the ride history in both portrait and landscape layouts.
Validate the ride history with long rider names.
Validate the ride history with long route names.
Validate the ride history with zero riders.
Validate the ride history with one rider.
Validate the ride history with a full group.
Validate the ride history with slow network conditions.
Validate the ride history with no network.
Validate the ride history with poor GPS accuracy.
Validate the ride history with rapidly changing telemetry.
Validate the ride history with accessibility text scaling.
Validate the ride history with reduced motion.
Validate the ride history with keyboard navigation where applicable.
Validate the ride history with screen readers for non-driving planning contexts.
Validate the ride history with touch and pointer input.
Validate the ride history with glove-friendly target sizing.
Document every interactive state of the ride history.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the ride history.
Create a reusable component contract for the ride history.
Keep component APIs semantic rather than visual-only for the ride history.
Separate data state from presentation state in the ride history.
Keep animation state separate from business state in the ride history.
Avoid hardcoding user-specific values into the ride history.
Drive ride history values from the application's data layer.
Keep the ride history resilient to missing optional data.
Keep the ride history deterministic during replay or ride-history inspection.
Use consistent time formatting across the ride history.
Use consistent distance formatting across the ride history.
Use consistent rider status terminology across the ride history.
Use consistent alert severity terminology across the ride history.
Use consistent route terminology across the ride history.
Use consistent checkpoint terminology across the ride history.
Use consistent connection terminology across the ride history.
Do not introduce a new visual pattern for the ride history if an existing pattern already solves the same problem.
Prefer composition over component nesting in the ride history.
Keep the visual surface of the ride history calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary ride history information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the ride history.
Use the reference HMI's instrument-panel logic as inspiration for the ride history.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the ride history feel native to Rideclub's spatial operating-system concept.
The final ride history must not look like a generic admin dashboard.
The final ride history must not look like a generic fintech dashboard.
The final ride history must not look like a generic social feed.
The final ride history must not look like a generic navigation clone.
The final ride history must feel like one cohesive Rideclub cockpit.
# 30 — ROUTE HISTORY
Define the route history as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the route history benefits from geographic awareness.
Use a restrained near-black foundation behind the route history.
Use #F4F7FA for primary readable values in the route history.
Use #AAB1BD for supporting labels in the route history.
Use #66707D for low-priority metadata in the route history.
Use #FF4D21 only for Rideclub-primary actions in the route history.
Use cyan for live communication state when applicable to the route history.
Use green for successful or healthy state when applicable to the route history.
Use amber for caution state when applicable to the route history.
Use red only for critical state when applicable to the route history.
Use technical typography for telemetry values associated with the route history.
Use human-readable typography for rider-facing copy associated with the route history.
Avoid unnecessary rounded rectangles in the route history.
Avoid placing every datum inside its own container in the route history.
Use one-pixel structural rules when the route history needs visual grouping.
Use negative space as the first grouping mechanism in the route history.
Use radial geometry when the route history represents a measurable quantity.
Use nodes when the route history represents people or geographic entities.
Use lines when the route history represents a relationship or sequence.
Use rings when the route history represents progress, cohesion, or capacity.
Use large numerals when the route history contains a primary metric.
Use compact labels when the route history contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive route history controls.
Provide a larger sixty-four-pixel interaction zone for the most important route history action during riding.
Do not require precise tapping for critical route history actions.
Use hold-to-confirm for irreversible or safety-sensitive route history actions where appropriate.
Provide immediate visual feedback for every interactive route history action.
Animate the route history only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the route history.
Use sixty-to-two-hundred-fifty millisecond transitions for normal route history UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the route history.
Use opacity changes to establish secondary hierarchy in the route history.
Use scale changes sparingly in the route history.
Avoid large bounce animations in the route history.
Use subtle glow to indicate active state in the route history.
Never use glow as the only indicator of an important route history state.
Pair important route history states with text, iconography, or geometry.
Preserve the visual hierarchy of the route history under reduced-motion settings.
Ensure the route history remains understandable without animation.
Ensure the route history remains usable at high text zoom.
Ensure the route history remains usable in strong outdoor light where possible.
Use high contrast between the route history primary value and its background.
Do not use tiny gray text for essential route history information.
Keep secondary route history information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the route history.
Use uppercase tracking only for short telemetry labels in the route history.
Use tabular numerals for changing route history values.
Keep decimal precision consistent across the route history.
Use locale-aware formatting for distance and speed in the route history.
Use metric units by default for the route history when the user is in a metric locale.
Allow unit preferences to be changed in settings for the route history.
Use safe-area insets around the route history on mobile devices.
Keep important route history content away from gesture navigation edges.
Support landscape orientation for riding-focused route history screens.
Support portrait orientation for planning-focused route history screens.
Allow the route history to reorganize rather than simply shrink at smaller widths.
Do not stack every route history element vertically on mobile.
Use edge rails for compact route history telemetry on narrow screens.
Use bottom sheets only when the route history needs temporary detailed interaction.
Avoid permanent bottom sheets for the route history unless the screen is specifically designed around one.
Keep map gestures available whenever the route history does not require modal focus.
Prevent accidental map gestures while interacting with critical route history controls.
Use pointer-events layering intentionally for the route history.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the route history.
Use MapLibre layers for geographic information whenever possible for the route history.
Use DOM overlays only for interaction-heavy route history controls.
Keep route geometry visually dominant over secondary map labels in the route history.
Dim irrelevant map detail behind active route history guidance.
Use a clear active route line for the route history.
Use a thinner inactive route line for alternate route history paths.
Use checkpoint nodes to divide long route history journeys into understandable segments.
Use start and destination markers consistently in the route history.
Use directional orientation for moving rider markers in the route history.
Avoid using generic pins for every route history object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the route history.
Use clustering when many route history entities overlap.
Use expansion behavior when a route history cluster is selected.
Use proximity to determine emphasis for nearby route history entities.
Use distance labels only when distance is actionable for the route history.
Use live state indicators for connected route history entities.
Use stale-state indicators when route history data has not updated recently.
Never imply live route history data when the network is offline.
Clearly communicate offline state within the route history.
Use cached data gracefully for the route history.
Design the route history to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the route history.
Show network state without turning the route history into a diagnostic screen.
Keep system diagnostics secondary to the route history user goal.
Use haptic-ready interaction semantics for the route history where supported.
Use sound-ready states for the route history where auditory feedback is useful.
Do not make sound the only indication of a critical route history state.
Use clear visual acknowledgment after the route history receives an action.
Use optimistic feedback only when the route history action can safely be reversed.
Use progress indicators for long-running route history operations.
Use skeletons only when they help preserve the route history layout.
Avoid generic spinner-only loading states for major route history screens.
Provide purposeful empty states for the route history.
Provide recovery actions for route history errors.
Keep error messages concise and actionable in the route history.
Use a technical but human tone for route history system messages.
Never use jargon that the rider cannot understand in the route history.
Keep safety-critical copy direct and unambiguous in the route history.
Validate the route history at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the route history at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the route history in both portrait and landscape layouts.
Validate the route history with long rider names.
Validate the route history with long route names.
Validate the route history with zero riders.
Validate the route history with one rider.
Validate the route history with a full group.
Validate the route history with slow network conditions.
Validate the route history with no network.
Validate the route history with poor GPS accuracy.
Validate the route history with rapidly changing telemetry.
Validate the route history with accessibility text scaling.
Validate the route history with reduced motion.
Validate the route history with keyboard navigation where applicable.
Validate the route history with screen readers for non-driving planning contexts.
Validate the route history with touch and pointer input.
Validate the route history with glove-friendly target sizing.
Document every interactive state of the route history.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the route history.
Create a reusable component contract for the route history.
Keep component APIs semantic rather than visual-only for the route history.
Separate data state from presentation state in the route history.
Keep animation state separate from business state in the route history.
Avoid hardcoding user-specific values into the route history.
Drive route history values from the application's data layer.
Keep the route history resilient to missing optional data.
Keep the route history deterministic during replay or ride-history inspection.
Use consistent time formatting across the route history.
Use consistent distance formatting across the route history.
Use consistent rider status terminology across the route history.
Use consistent alert severity terminology across the route history.
Use consistent route terminology across the route history.
Use consistent checkpoint terminology across the route history.
Use consistent connection terminology across the route history.
Do not introduce a new visual pattern for the route history if an existing pattern already solves the same problem.
Prefer composition over component nesting in the route history.
Keep the visual surface of the route history calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary route history information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the route history.
Use the reference HMI's instrument-panel logic as inspiration for the route history.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the route history feel native to Rideclub's spatial operating-system concept.
The final route history must not look like a generic admin dashboard.
The final route history must not look like a generic fintech dashboard.
The final route history must not look like a generic social feed.
The final route history must not look like a generic navigation clone.
The final route history must feel like one cohesive Rideclub cockpit.
# 31 — ACHIEVEMENTS
Define the achievements as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the achievements benefits from geographic awareness.
Use a restrained near-black foundation behind the achievements.
Use #F4F7FA for primary readable values in the achievements.
Use #AAB1BD for supporting labels in the achievements.
Use #66707D for low-priority metadata in the achievements.
Use #FF4D21 only for Rideclub-primary actions in the achievements.
Use cyan for live communication state when applicable to the achievements.
Use green for successful or healthy state when applicable to the achievements.
Use amber for caution state when applicable to the achievements.
Use red only for critical state when applicable to the achievements.
Use technical typography for telemetry values associated with the achievements.
Use human-readable typography for rider-facing copy associated with the achievements.
Avoid unnecessary rounded rectangles in the achievements.
Avoid placing every datum inside its own container in the achievements.
Use one-pixel structural rules when the achievements needs visual grouping.
Use negative space as the first grouping mechanism in the achievements.
Use radial geometry when the achievements represents a measurable quantity.
Use nodes when the achievements represents people or geographic entities.
Use lines when the achievements represents a relationship or sequence.
Use rings when the achievements represents progress, cohesion, or capacity.
Use large numerals when the achievements contains a primary metric.
Use compact labels when the achievements contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive achievements controls.
Provide a larger sixty-four-pixel interaction zone for the most important achievements action during riding.
Do not require precise tapping for critical achievements actions.
Use hold-to-confirm for irreversible or safety-sensitive achievements actions where appropriate.
Provide immediate visual feedback for every interactive achievements action.
Animate the achievements only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the achievements.
Use sixty-to-two-hundred-fifty millisecond transitions for normal achievements UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the achievements.
Use opacity changes to establish secondary hierarchy in the achievements.
Use scale changes sparingly in the achievements.
Avoid large bounce animations in the achievements.
Use subtle glow to indicate active state in the achievements.
Never use glow as the only indicator of an important achievements state.
Pair important achievements states with text, iconography, or geometry.
Preserve the visual hierarchy of the achievements under reduced-motion settings.
Ensure the achievements remains understandable without animation.
Ensure the achievements remains usable at high text zoom.
Ensure the achievements remains usable in strong outdoor light where possible.
Use high contrast between the achievements primary value and its background.
Do not use tiny gray text for essential achievements information.
Keep secondary achievements information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the achievements.
Use uppercase tracking only for short telemetry labels in the achievements.
Use tabular numerals for changing achievements values.
Keep decimal precision consistent across the achievements.
Use locale-aware formatting for distance and speed in the achievements.
Use metric units by default for the achievements when the user is in a metric locale.
Allow unit preferences to be changed in settings for the achievements.
Use safe-area insets around the achievements on mobile devices.
Keep important achievements content away from gesture navigation edges.
Support landscape orientation for riding-focused achievements screens.
Support portrait orientation for planning-focused achievements screens.
Allow the achievements to reorganize rather than simply shrink at smaller widths.
Do not stack every achievements element vertically on mobile.
Use edge rails for compact achievements telemetry on narrow screens.
Use bottom sheets only when the achievements needs temporary detailed interaction.
Avoid permanent bottom sheets for the achievements unless the screen is specifically designed around one.
Keep map gestures available whenever the achievements does not require modal focus.
Prevent accidental map gestures while interacting with critical achievements controls.
Use pointer-events layering intentionally for the achievements.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the achievements.
Use MapLibre layers for geographic information whenever possible for the achievements.
Use DOM overlays only for interaction-heavy achievements controls.
Keep route geometry visually dominant over secondary map labels in the achievements.
Dim irrelevant map detail behind active achievements guidance.
Use a clear active route line for the achievements.
Use a thinner inactive route line for alternate achievements paths.
Use checkpoint nodes to divide long achievements journeys into understandable segments.
Use start and destination markers consistently in the achievements.
Use directional orientation for moving rider markers in the achievements.
Avoid using generic pins for every achievements object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the achievements.
Use clustering when many achievements entities overlap.
Use expansion behavior when a achievements cluster is selected.
Use proximity to determine emphasis for nearby achievements entities.
Use distance labels only when distance is actionable for the achievements.
Use live state indicators for connected achievements entities.
Use stale-state indicators when achievements data has not updated recently.
Never imply live achievements data when the network is offline.
Clearly communicate offline state within the achievements.
Use cached data gracefully for the achievements.
Design the achievements to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the achievements.
Show network state without turning the achievements into a diagnostic screen.
Keep system diagnostics secondary to the achievements user goal.
Use haptic-ready interaction semantics for the achievements where supported.
Use sound-ready states for the achievements where auditory feedback is useful.
Do not make sound the only indication of a critical achievements state.
Use clear visual acknowledgment after the achievements receives an action.
Use optimistic feedback only when the achievements action can safely be reversed.
Use progress indicators for long-running achievements operations.
Use skeletons only when they help preserve the achievements layout.
Avoid generic spinner-only loading states for major achievements screens.
Provide purposeful empty states for the achievements.
Provide recovery actions for achievements errors.
Keep error messages concise and actionable in the achievements.
Use a technical but human tone for achievements system messages.
Never use jargon that the rider cannot understand in the achievements.
Keep safety-critical copy direct and unambiguous in the achievements.
Validate the achievements at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the achievements at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the achievements in both portrait and landscape layouts.
Validate the achievements with long rider names.
Validate the achievements with long route names.
Validate the achievements with zero riders.
Validate the achievements with one rider.
Validate the achievements with a full group.
Validate the achievements with slow network conditions.
Validate the achievements with no network.
Validate the achievements with poor GPS accuracy.
Validate the achievements with rapidly changing telemetry.
Validate the achievements with accessibility text scaling.
Validate the achievements with reduced motion.
Validate the achievements with keyboard navigation where applicable.
Validate the achievements with screen readers for non-driving planning contexts.
Validate the achievements with touch and pointer input.
Validate the achievements with glove-friendly target sizing.
Document every interactive state of the achievements.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the achievements.
Create a reusable component contract for the achievements.
Keep component APIs semantic rather than visual-only for the achievements.
Separate data state from presentation state in the achievements.
Keep animation state separate from business state in the achievements.
Avoid hardcoding user-specific values into the achievements.
Drive achievements values from the application's data layer.
Keep the achievements resilient to missing optional data.
Keep the achievements deterministic during replay or ride-history inspection.
Use consistent time formatting across the achievements.
Use consistent distance formatting across the achievements.
Use consistent rider status terminology across the achievements.
Use consistent alert severity terminology across the achievements.
Use consistent route terminology across the achievements.
Use consistent checkpoint terminology across the achievements.
Use consistent connection terminology across the achievements.
Do not introduce a new visual pattern for the achievements if an existing pattern already solves the same problem.
Prefer composition over component nesting in the achievements.
Keep the visual surface of the achievements calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary achievements information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the achievements.
Use the reference HMI's instrument-panel logic as inspiration for the achievements.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the achievements feel native to Rideclub's spatial operating-system concept.
The final achievements must not look like a generic admin dashboard.
The final achievements must not look like a generic fintech dashboard.
The final achievements must not look like a generic social feed.
The final achievements must not look like a generic navigation clone.
The final achievements must feel like one cohesive Rideclub cockpit.
# 32 — COMMUNICATION
Define the communication as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the communication benefits from geographic awareness.
Use a restrained near-black foundation behind the communication.
Use #F4F7FA for primary readable values in the communication.
Use #AAB1BD for supporting labels in the communication.
Use #66707D for low-priority metadata in the communication.
Use #FF4D21 only for Rideclub-primary actions in the communication.
Use cyan for live communication state when applicable to the communication.
Use green for successful or healthy state when applicable to the communication.
Use amber for caution state when applicable to the communication.
Use red only for critical state when applicable to the communication.
Use technical typography for telemetry values associated with the communication.
Use human-readable typography for rider-facing copy associated with the communication.
Avoid unnecessary rounded rectangles in the communication.
Avoid placing every datum inside its own container in the communication.
Use one-pixel structural rules when the communication needs visual grouping.
Use negative space as the first grouping mechanism in the communication.
Use radial geometry when the communication represents a measurable quantity.
Use nodes when the communication represents people or geographic entities.
Use lines when the communication represents a relationship or sequence.
Use rings when the communication represents progress, cohesion, or capacity.
Use large numerals when the communication contains a primary metric.
Use compact labels when the communication contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive communication controls.
Provide a larger sixty-four-pixel interaction zone for the most important communication action during riding.
Do not require precise tapping for critical communication actions.
Use hold-to-confirm for irreversible or safety-sensitive communication actions where appropriate.
Provide immediate visual feedback for every interactive communication action.
Animate the communication only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the communication.
Use sixty-to-two-hundred-fifty millisecond transitions for normal communication UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the communication.
Use opacity changes to establish secondary hierarchy in the communication.
Use scale changes sparingly in the communication.
Avoid large bounce animations in the communication.
Use subtle glow to indicate active state in the communication.
Never use glow as the only indicator of an important communication state.
Pair important communication states with text, iconography, or geometry.
Preserve the visual hierarchy of the communication under reduced-motion settings.
Ensure the communication remains understandable without animation.
Ensure the communication remains usable at high text zoom.
Ensure the communication remains usable in strong outdoor light where possible.
Use high contrast between the communication primary value and its background.
Do not use tiny gray text for essential communication information.
Keep secondary communication information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the communication.
Use uppercase tracking only for short telemetry labels in the communication.
Use tabular numerals for changing communication values.
Keep decimal precision consistent across the communication.
Use locale-aware formatting for distance and speed in the communication.
Use metric units by default for the communication when the user is in a metric locale.
Allow unit preferences to be changed in settings for the communication.
Use safe-area insets around the communication on mobile devices.
Keep important communication content away from gesture navigation edges.
Support landscape orientation for riding-focused communication screens.
Support portrait orientation for planning-focused communication screens.
Allow the communication to reorganize rather than simply shrink at smaller widths.
Do not stack every communication element vertically on mobile.
Use edge rails for compact communication telemetry on narrow screens.
Use bottom sheets only when the communication needs temporary detailed interaction.
Avoid permanent bottom sheets for the communication unless the screen is specifically designed around one.
Keep map gestures available whenever the communication does not require modal focus.
Prevent accidental map gestures while interacting with critical communication controls.
Use pointer-events layering intentionally for the communication.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the communication.
Use MapLibre layers for geographic information whenever possible for the communication.
Use DOM overlays only for interaction-heavy communication controls.
Keep route geometry visually dominant over secondary map labels in the communication.
Dim irrelevant map detail behind active communication guidance.
Use a clear active route line for the communication.
Use a thinner inactive route line for alternate communication paths.
Use checkpoint nodes to divide long communication journeys into understandable segments.
Use start and destination markers consistently in the communication.
Use directional orientation for moving rider markers in the communication.
Avoid using generic pins for every communication object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the communication.
Use clustering when many communication entities overlap.
Use expansion behavior when a communication cluster is selected.
Use proximity to determine emphasis for nearby communication entities.
Use distance labels only when distance is actionable for the communication.
Use live state indicators for connected communication entities.
Use stale-state indicators when communication data has not updated recently.
Never imply live communication data when the network is offline.
Clearly communicate offline state within the communication.
Use cached data gracefully for the communication.
Design the communication to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the communication.
Show network state without turning the communication into a diagnostic screen.
Keep system diagnostics secondary to the communication user goal.
Use haptic-ready interaction semantics for the communication where supported.
Use sound-ready states for the communication where auditory feedback is useful.
Do not make sound the only indication of a critical communication state.
Use clear visual acknowledgment after the communication receives an action.
Use optimistic feedback only when the communication action can safely be reversed.
Use progress indicators for long-running communication operations.
Use skeletons only when they help preserve the communication layout.
Avoid generic spinner-only loading states for major communication screens.
Provide purposeful empty states for the communication.
Provide recovery actions for communication errors.
Keep error messages concise and actionable in the communication.
Use a technical but human tone for communication system messages.
Never use jargon that the rider cannot understand in the communication.
Keep safety-critical copy direct and unambiguous in the communication.
Validate the communication at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the communication at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the communication in both portrait and landscape layouts.
Validate the communication with long rider names.
Validate the communication with long route names.
Validate the communication with zero riders.
Validate the communication with one rider.
Validate the communication with a full group.
Validate the communication with slow network conditions.
Validate the communication with no network.
Validate the communication with poor GPS accuracy.
Validate the communication with rapidly changing telemetry.
Validate the communication with accessibility text scaling.
Validate the communication with reduced motion.
Validate the communication with keyboard navigation where applicable.
Validate the communication with screen readers for non-driving planning contexts.
Validate the communication with touch and pointer input.
Validate the communication with glove-friendly target sizing.
Document every interactive state of the communication.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the communication.
Create a reusable component contract for the communication.
Keep component APIs semantic rather than visual-only for the communication.
Separate data state from presentation state in the communication.
Keep animation state separate from business state in the communication.
Avoid hardcoding user-specific values into the communication.
Drive communication values from the application's data layer.
Keep the communication resilient to missing optional data.
Keep the communication deterministic during replay or ride-history inspection.
Use consistent time formatting across the communication.
Use consistent distance formatting across the communication.
Use consistent rider status terminology across the communication.
Use consistent alert severity terminology across the communication.
Use consistent route terminology across the communication.
Use consistent checkpoint terminology across the communication.
Use consistent connection terminology across the communication.
Do not introduce a new visual pattern for the communication if an existing pattern already solves the same problem.
Prefer composition over component nesting in the communication.
Keep the visual surface of the communication calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary communication information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the communication.
Use the reference HMI's instrument-panel logic as inspiration for the communication.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the communication feel native to Rideclub's spatial operating-system concept.
The final communication must not look like a generic admin dashboard.
The final communication must not look like a generic fintech dashboard.
The final communication must not look like a generic social feed.
The final communication must not look like a generic navigation clone.
The final communication must feel like one cohesive Rideclub cockpit.
# 33 — WALKIE-TALKIE MODE
Define the walkie talkie as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the walkie talkie benefits from geographic awareness.
Use a restrained near-black foundation behind the walkie talkie.
Use #F4F7FA for primary readable values in the walkie talkie.
Use #AAB1BD for supporting labels in the walkie talkie.
Use #66707D for low-priority metadata in the walkie talkie.
Use #FF4D21 only for Rideclub-primary actions in the walkie talkie.
Use cyan for live communication state when applicable to the walkie talkie.
Use green for successful or healthy state when applicable to the walkie talkie.
Use amber for caution state when applicable to the walkie talkie.
Use red only for critical state when applicable to the walkie talkie.
Use technical typography for telemetry values associated with the walkie talkie.
Use human-readable typography for rider-facing copy associated with the walkie talkie.
Avoid unnecessary rounded rectangles in the walkie talkie.
Avoid placing every datum inside its own container in the walkie talkie.
Use one-pixel structural rules when the walkie talkie needs visual grouping.
Use negative space as the first grouping mechanism in the walkie talkie.
Use radial geometry when the walkie talkie represents a measurable quantity.
Use nodes when the walkie talkie represents people or geographic entities.
Use lines when the walkie talkie represents a relationship or sequence.
Use rings when the walkie talkie represents progress, cohesion, or capacity.
Use large numerals when the walkie talkie contains a primary metric.
Use compact labels when the walkie talkie contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive walkie talkie controls.
Provide a larger sixty-four-pixel interaction zone for the most important walkie talkie action during riding.
Do not require precise tapping for critical walkie talkie actions.
Use hold-to-confirm for irreversible or safety-sensitive walkie talkie actions where appropriate.
Provide immediate visual feedback for every interactive walkie talkie action.
Animate the walkie talkie only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the walkie talkie.
Use sixty-to-two-hundred-fifty millisecond transitions for normal walkie talkie UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the walkie talkie.
Use opacity changes to establish secondary hierarchy in the walkie talkie.
Use scale changes sparingly in the walkie talkie.
Avoid large bounce animations in the walkie talkie.
Use subtle glow to indicate active state in the walkie talkie.
Never use glow as the only indicator of an important walkie talkie state.
Pair important walkie talkie states with text, iconography, or geometry.
Preserve the visual hierarchy of the walkie talkie under reduced-motion settings.
Ensure the walkie talkie remains understandable without animation.
Ensure the walkie talkie remains usable at high text zoom.
Ensure the walkie talkie remains usable in strong outdoor light where possible.
Use high contrast between the walkie talkie primary value and its background.
Do not use tiny gray text for essential walkie talkie information.
Keep secondary walkie talkie information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the walkie talkie.
Use uppercase tracking only for short telemetry labels in the walkie talkie.
Use tabular numerals for changing walkie talkie values.
Keep decimal precision consistent across the walkie talkie.
Use locale-aware formatting for distance and speed in the walkie talkie.
Use metric units by default for the walkie talkie when the user is in a metric locale.
Allow unit preferences to be changed in settings for the walkie talkie.
Use safe-area insets around the walkie talkie on mobile devices.
Keep important walkie talkie content away from gesture navigation edges.
Support landscape orientation for riding-focused walkie talkie screens.
Support portrait orientation for planning-focused walkie talkie screens.
Allow the walkie talkie to reorganize rather than simply shrink at smaller widths.
Do not stack every walkie talkie element vertically on mobile.
Use edge rails for compact walkie talkie telemetry on narrow screens.
Use bottom sheets only when the walkie talkie needs temporary detailed interaction.
Avoid permanent bottom sheets for the walkie talkie unless the screen is specifically designed around one.
Keep map gestures available whenever the walkie talkie does not require modal focus.
Prevent accidental map gestures while interacting with critical walkie talkie controls.
Use pointer-events layering intentionally for the walkie talkie.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the walkie talkie.
Use MapLibre layers for geographic information whenever possible for the walkie talkie.
Use DOM overlays only for interaction-heavy walkie talkie controls.
Keep route geometry visually dominant over secondary map labels in the walkie talkie.
Dim irrelevant map detail behind active walkie talkie guidance.
Use a clear active route line for the walkie talkie.
Use a thinner inactive route line for alternate walkie talkie paths.
Use checkpoint nodes to divide long walkie talkie journeys into understandable segments.
Use start and destination markers consistently in the walkie talkie.
Use directional orientation for moving rider markers in the walkie talkie.
Avoid using generic pins for every walkie talkie object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the walkie talkie.
Use clustering when many walkie talkie entities overlap.
Use expansion behavior when a walkie talkie cluster is selected.
Use proximity to determine emphasis for nearby walkie talkie entities.
Use distance labels only when distance is actionable for the walkie talkie.
Use live state indicators for connected walkie talkie entities.
Use stale-state indicators when walkie talkie data has not updated recently.
Never imply live walkie talkie data when the network is offline.
Clearly communicate offline state within the walkie talkie.
Use cached data gracefully for the walkie talkie.
Design the walkie talkie to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the walkie talkie.
Show network state without turning the walkie talkie into a diagnostic screen.
Keep system diagnostics secondary to the walkie talkie user goal.
Use haptic-ready interaction semantics for the walkie talkie where supported.
Use sound-ready states for the walkie talkie where auditory feedback is useful.
Do not make sound the only indication of a critical walkie talkie state.
Use clear visual acknowledgment after the walkie talkie receives an action.
Use optimistic feedback only when the walkie talkie action can safely be reversed.
Use progress indicators for long-running walkie talkie operations.
Use skeletons only when they help preserve the walkie talkie layout.
Avoid generic spinner-only loading states for major walkie talkie screens.
Provide purposeful empty states for the walkie talkie.
Provide recovery actions for walkie talkie errors.
Keep error messages concise and actionable in the walkie talkie.
Use a technical but human tone for walkie talkie system messages.
Never use jargon that the rider cannot understand in the walkie talkie.
Keep safety-critical copy direct and unambiguous in the walkie talkie.
Validate the walkie talkie at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the walkie talkie at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the walkie talkie in both portrait and landscape layouts.
Validate the walkie talkie with long rider names.
Validate the walkie talkie with long route names.
Validate the walkie talkie with zero riders.
Validate the walkie talkie with one rider.
Validate the walkie talkie with a full group.
Validate the walkie talkie with slow network conditions.
Validate the walkie talkie with no network.
Validate the walkie talkie with poor GPS accuracy.
Validate the walkie talkie with rapidly changing telemetry.
Validate the walkie talkie with accessibility text scaling.
Validate the walkie talkie with reduced motion.
Validate the walkie talkie with keyboard navigation where applicable.
Validate the walkie talkie with screen readers for non-driving planning contexts.
Validate the walkie talkie with touch and pointer input.
Validate the walkie talkie with glove-friendly target sizing.
Document every interactive state of the walkie talkie.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the walkie talkie.
Create a reusable component contract for the walkie talkie.
Keep component APIs semantic rather than visual-only for the walkie talkie.
Separate data state from presentation state in the walkie talkie.
Keep animation state separate from business state in the walkie talkie.
Avoid hardcoding user-specific values into the walkie talkie.
Drive walkie talkie values from the application's data layer.
Keep the walkie talkie resilient to missing optional data.
Keep the walkie talkie deterministic during replay or ride-history inspection.
Use consistent time formatting across the walkie talkie.
Use consistent distance formatting across the walkie talkie.
Use consistent rider status terminology across the walkie talkie.
Use consistent alert severity terminology across the walkie talkie.
Use consistent route terminology across the walkie talkie.
Use consistent checkpoint terminology across the walkie talkie.
Use consistent connection terminology across the walkie talkie.
Do not introduce a new visual pattern for the walkie talkie if an existing pattern already solves the same problem.
Prefer composition over component nesting in the walkie talkie.
Keep the visual surface of the walkie talkie calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary walkie talkie information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the walkie talkie.
Use the reference HMI's instrument-panel logic as inspiration for the walkie talkie.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the walkie talkie feel native to Rideclub's spatial operating-system concept.
The final walkie talkie must not look like a generic admin dashboard.
The final walkie talkie must not look like a generic fintech dashboard.
The final walkie talkie must not look like a generic social feed.
The final walkie talkie must not look like a generic navigation clone.
The final walkie talkie must feel like one cohesive Rideclub cockpit.
# 34 — OFFLINE NETWORK
Define the offline mesh as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the offline mesh benefits from geographic awareness.
Use a restrained near-black foundation behind the offline mesh.
Use #F4F7FA for primary readable values in the offline mesh.
Use #AAB1BD for supporting labels in the offline mesh.
Use #66707D for low-priority metadata in the offline mesh.
Use #FF4D21 only for Rideclub-primary actions in the offline mesh.
Use cyan for live communication state when applicable to the offline mesh.
Use green for successful or healthy state when applicable to the offline mesh.
Use amber for caution state when applicable to the offline mesh.
Use red only for critical state when applicable to the offline mesh.
Use technical typography for telemetry values associated with the offline mesh.
Use human-readable typography for rider-facing copy associated with the offline mesh.
Avoid unnecessary rounded rectangles in the offline mesh.
Avoid placing every datum inside its own container in the offline mesh.
Use one-pixel structural rules when the offline mesh needs visual grouping.
Use negative space as the first grouping mechanism in the offline mesh.
Use radial geometry when the offline mesh represents a measurable quantity.
Use nodes when the offline mesh represents people or geographic entities.
Use lines when the offline mesh represents a relationship or sequence.
Use rings when the offline mesh represents progress, cohesion, or capacity.
Use large numerals when the offline mesh contains a primary metric.
Use compact labels when the offline mesh contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive offline mesh controls.
Provide a larger sixty-four-pixel interaction zone for the most important offline mesh action during riding.
Do not require precise tapping for critical offline mesh actions.
Use hold-to-confirm for irreversible or safety-sensitive offline mesh actions where appropriate.
Provide immediate visual feedback for every interactive offline mesh action.
Animate the offline mesh only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the offline mesh.
Use sixty-to-two-hundred-fifty millisecond transitions for normal offline mesh UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the offline mesh.
Use opacity changes to establish secondary hierarchy in the offline mesh.
Use scale changes sparingly in the offline mesh.
Avoid large bounce animations in the offline mesh.
Use subtle glow to indicate active state in the offline mesh.
Never use glow as the only indicator of an important offline mesh state.
Pair important offline mesh states with text, iconography, or geometry.
Preserve the visual hierarchy of the offline mesh under reduced-motion settings.
Ensure the offline mesh remains understandable without animation.
Ensure the offline mesh remains usable at high text zoom.
Ensure the offline mesh remains usable in strong outdoor light where possible.
Use high contrast between the offline mesh primary value and its background.
Do not use tiny gray text for essential offline mesh information.
Keep secondary offline mesh information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the offline mesh.
Use uppercase tracking only for short telemetry labels in the offline mesh.
Use tabular numerals for changing offline mesh values.
Keep decimal precision consistent across the offline mesh.
Use locale-aware formatting for distance and speed in the offline mesh.
Use metric units by default for the offline mesh when the user is in a metric locale.
Allow unit preferences to be changed in settings for the offline mesh.
Use safe-area insets around the offline mesh on mobile devices.
Keep important offline mesh content away from gesture navigation edges.
Support landscape orientation for riding-focused offline mesh screens.
Support portrait orientation for planning-focused offline mesh screens.
Allow the offline mesh to reorganize rather than simply shrink at smaller widths.
Do not stack every offline mesh element vertically on mobile.
Use edge rails for compact offline mesh telemetry on narrow screens.
Use bottom sheets only when the offline mesh needs temporary detailed interaction.
Avoid permanent bottom sheets for the offline mesh unless the screen is specifically designed around one.
Keep map gestures available whenever the offline mesh does not require modal focus.
Prevent accidental map gestures while interacting with critical offline mesh controls.
Use pointer-events layering intentionally for the offline mesh.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the offline mesh.
Use MapLibre layers for geographic information whenever possible for the offline mesh.
Use DOM overlays only for interaction-heavy offline mesh controls.
Keep route geometry visually dominant over secondary map labels in the offline mesh.
Dim irrelevant map detail behind active offline mesh guidance.
Use a clear active route line for the offline mesh.
Use a thinner inactive route line for alternate offline mesh paths.
Use checkpoint nodes to divide long offline mesh journeys into understandable segments.
Use start and destination markers consistently in the offline mesh.
Use directional orientation for moving rider markers in the offline mesh.
Avoid using generic pins for every offline mesh object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the offline mesh.
Use clustering when many offline mesh entities overlap.
Use expansion behavior when a offline mesh cluster is selected.
Use proximity to determine emphasis for nearby offline mesh entities.
Use distance labels only when distance is actionable for the offline mesh.
Use live state indicators for connected offline mesh entities.
Use stale-state indicators when offline mesh data has not updated recently.
Never imply live offline mesh data when the network is offline.
Clearly communicate offline state within the offline mesh.
Use cached data gracefully for the offline mesh.
Design the offline mesh to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the offline mesh.
Show network state without turning the offline mesh into a diagnostic screen.
Keep system diagnostics secondary to the offline mesh user goal.
Use haptic-ready interaction semantics for the offline mesh where supported.
Use sound-ready states for the offline mesh where auditory feedback is useful.
Do not make sound the only indication of a critical offline mesh state.
Use clear visual acknowledgment after the offline mesh receives an action.
Use optimistic feedback only when the offline mesh action can safely be reversed.
Use progress indicators for long-running offline mesh operations.
Use skeletons only when they help preserve the offline mesh layout.
Avoid generic spinner-only loading states for major offline mesh screens.
Provide purposeful empty states for the offline mesh.
Provide recovery actions for offline mesh errors.
Keep error messages concise and actionable in the offline mesh.
Use a technical but human tone for offline mesh system messages.
Never use jargon that the rider cannot understand in the offline mesh.
Keep safety-critical copy direct and unambiguous in the offline mesh.
Validate the offline mesh at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the offline mesh at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the offline mesh in both portrait and landscape layouts.
Validate the offline mesh with long rider names.
Validate the offline mesh with long route names.
Validate the offline mesh with zero riders.
Validate the offline mesh with one rider.
Validate the offline mesh with a full group.
Validate the offline mesh with slow network conditions.
Validate the offline mesh with no network.
Validate the offline mesh with poor GPS accuracy.
Validate the offline mesh with rapidly changing telemetry.
Validate the offline mesh with accessibility text scaling.
Validate the offline mesh with reduced motion.
Validate the offline mesh with keyboard navigation where applicable.
Validate the offline mesh with screen readers for non-driving planning contexts.
Validate the offline mesh with touch and pointer input.
Validate the offline mesh with glove-friendly target sizing.
Document every interactive state of the offline mesh.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the offline mesh.
Create a reusable component contract for the offline mesh.
Keep component APIs semantic rather than visual-only for the offline mesh.
Separate data state from presentation state in the offline mesh.
Keep animation state separate from business state in the offline mesh.
Avoid hardcoding user-specific values into the offline mesh.
Drive offline mesh values from the application's data layer.
Keep the offline mesh resilient to missing optional data.
Keep the offline mesh deterministic during replay or ride-history inspection.
Use consistent time formatting across the offline mesh.
Use consistent distance formatting across the offline mesh.
Use consistent rider status terminology across the offline mesh.
Use consistent alert severity terminology across the offline mesh.
Use consistent route terminology across the offline mesh.
Use consistent checkpoint terminology across the offline mesh.
Use consistent connection terminology across the offline mesh.
Do not introduce a new visual pattern for the offline mesh if an existing pattern already solves the same problem.
Prefer composition over component nesting in the offline mesh.
Keep the visual surface of the offline mesh calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary offline mesh information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the offline mesh.
Use the reference HMI's instrument-panel logic as inspiration for the offline mesh.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the offline mesh feel native to Rideclub's spatial operating-system concept.
The final offline mesh must not look like a generic admin dashboard.
The final offline mesh must not look like a generic fintech dashboard.
The final offline mesh must not look like a generic social feed.
The final offline mesh must not look like a generic navigation clone.
The final offline mesh must feel like one cohesive Rideclub cockpit.
# 35 — OFFLINE MAPS
Define the offline maps as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the offline maps benefits from geographic awareness.
Use a restrained near-black foundation behind the offline maps.
Use #F4F7FA for primary readable values in the offline maps.
Use #AAB1BD for supporting labels in the offline maps.
Use #66707D for low-priority metadata in the offline maps.
Use #FF4D21 only for Rideclub-primary actions in the offline maps.
Use cyan for live communication state when applicable to the offline maps.
Use green for successful or healthy state when applicable to the offline maps.
Use amber for caution state when applicable to the offline maps.
Use red only for critical state when applicable to the offline maps.
Use technical typography for telemetry values associated with the offline maps.
Use human-readable typography for rider-facing copy associated with the offline maps.
Avoid unnecessary rounded rectangles in the offline maps.
Avoid placing every datum inside its own container in the offline maps.
Use one-pixel structural rules when the offline maps needs visual grouping.
Use negative space as the first grouping mechanism in the offline maps.
Use radial geometry when the offline maps represents a measurable quantity.
Use nodes when the offline maps represents people or geographic entities.
Use lines when the offline maps represents a relationship or sequence.
Use rings when the offline maps represents progress, cohesion, or capacity.
Use large numerals when the offline maps contains a primary metric.
Use compact labels when the offline maps contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive offline maps controls.
Provide a larger sixty-four-pixel interaction zone for the most important offline maps action during riding.
Do not require precise tapping for critical offline maps actions.
Use hold-to-confirm for irreversible or safety-sensitive offline maps actions where appropriate.
Provide immediate visual feedback for every interactive offline maps action.
Animate the offline maps only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the offline maps.
Use sixty-to-two-hundred-fifty millisecond transitions for normal offline maps UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the offline maps.
Use opacity changes to establish secondary hierarchy in the offline maps.
Use scale changes sparingly in the offline maps.
Avoid large bounce animations in the offline maps.
Use subtle glow to indicate active state in the offline maps.
Never use glow as the only indicator of an important offline maps state.
Pair important offline maps states with text, iconography, or geometry.
Preserve the visual hierarchy of the offline maps under reduced-motion settings.
Ensure the offline maps remains understandable without animation.
Ensure the offline maps remains usable at high text zoom.
Ensure the offline maps remains usable in strong outdoor light where possible.
Use high contrast between the offline maps primary value and its background.
Do not use tiny gray text for essential offline maps information.
Keep secondary offline maps information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the offline maps.
Use uppercase tracking only for short telemetry labels in the offline maps.
Use tabular numerals for changing offline maps values.
Keep decimal precision consistent across the offline maps.
Use locale-aware formatting for distance and speed in the offline maps.
Use metric units by default for the offline maps when the user is in a metric locale.
Allow unit preferences to be changed in settings for the offline maps.
Use safe-area insets around the offline maps on mobile devices.
Keep important offline maps content away from gesture navigation edges.
Support landscape orientation for riding-focused offline maps screens.
Support portrait orientation for planning-focused offline maps screens.
Allow the offline maps to reorganize rather than simply shrink at smaller widths.
Do not stack every offline maps element vertically on mobile.
Use edge rails for compact offline maps telemetry on narrow screens.
Use bottom sheets only when the offline maps needs temporary detailed interaction.
Avoid permanent bottom sheets for the offline maps unless the screen is specifically designed around one.
Keep map gestures available whenever the offline maps does not require modal focus.
Prevent accidental map gestures while interacting with critical offline maps controls.
Use pointer-events layering intentionally for the offline maps.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the offline maps.
Use MapLibre layers for geographic information whenever possible for the offline maps.
Use DOM overlays only for interaction-heavy offline maps controls.
Keep route geometry visually dominant over secondary map labels in the offline maps.
Dim irrelevant map detail behind active offline maps guidance.
Use a clear active route line for the offline maps.
Use a thinner inactive route line for alternate offline maps paths.
Use checkpoint nodes to divide long offline maps journeys into understandable segments.
Use start and destination markers consistently in the offline maps.
Use directional orientation for moving rider markers in the offline maps.
Avoid using generic pins for every offline maps object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the offline maps.
Use clustering when many offline maps entities overlap.
Use expansion behavior when a offline maps cluster is selected.
Use proximity to determine emphasis for nearby offline maps entities.
Use distance labels only when distance is actionable for the offline maps.
Use live state indicators for connected offline maps entities.
Use stale-state indicators when offline maps data has not updated recently.
Never imply live offline maps data when the network is offline.
Clearly communicate offline state within the offline maps.
Use cached data gracefully for the offline maps.
Design the offline maps to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the offline maps.
Show network state without turning the offline maps into a diagnostic screen.
Keep system diagnostics secondary to the offline maps user goal.
Use haptic-ready interaction semantics for the offline maps where supported.
Use sound-ready states for the offline maps where auditory feedback is useful.
Do not make sound the only indication of a critical offline maps state.
Use clear visual acknowledgment after the offline maps receives an action.
Use optimistic feedback only when the offline maps action can safely be reversed.
Use progress indicators for long-running offline maps operations.
Use skeletons only when they help preserve the offline maps layout.
Avoid generic spinner-only loading states for major offline maps screens.
Provide purposeful empty states for the offline maps.
Provide recovery actions for offline maps errors.
Keep error messages concise and actionable in the offline maps.
Use a technical but human tone for offline maps system messages.
Never use jargon that the rider cannot understand in the offline maps.
Keep safety-critical copy direct and unambiguous in the offline maps.
Validate the offline maps at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the offline maps at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the offline maps in both portrait and landscape layouts.
Validate the offline maps with long rider names.
Validate the offline maps with long route names.
Validate the offline maps with zero riders.
Validate the offline maps with one rider.
Validate the offline maps with a full group.
Validate the offline maps with slow network conditions.
Validate the offline maps with no network.
Validate the offline maps with poor GPS accuracy.
Validate the offline maps with rapidly changing telemetry.
Validate the offline maps with accessibility text scaling.
Validate the offline maps with reduced motion.
Validate the offline maps with keyboard navigation where applicable.
Validate the offline maps with screen readers for non-driving planning contexts.
Validate the offline maps with touch and pointer input.
Validate the offline maps with glove-friendly target sizing.
Document every interactive state of the offline maps.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the offline maps.
Create a reusable component contract for the offline maps.
Keep component APIs semantic rather than visual-only for the offline maps.
Separate data state from presentation state in the offline maps.
Keep animation state separate from business state in the offline maps.
Avoid hardcoding user-specific values into the offline maps.
Drive offline maps values from the application's data layer.
Keep the offline maps resilient to missing optional data.
Keep the offline maps deterministic during replay or ride-history inspection.
Use consistent time formatting across the offline maps.
Use consistent distance formatting across the offline maps.
Use consistent rider status terminology across the offline maps.
Use consistent alert severity terminology across the offline maps.
Use consistent route terminology across the offline maps.
Use consistent checkpoint terminology across the offline maps.
Use consistent connection terminology across the offline maps.
Do not introduce a new visual pattern for the offline maps if an existing pattern already solves the same problem.
Prefer composition over component nesting in the offline maps.
Keep the visual surface of the offline maps calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary offline maps information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the offline maps.
Use the reference HMI's instrument-panel logic as inspiration for the offline maps.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the offline maps feel native to Rideclub's spatial operating-system concept.
The final offline maps must not look like a generic admin dashboard.
The final offline maps must not look like a generic fintech dashboard.
The final offline maps must not look like a generic social feed.
The final offline maps must not look like a generic navigation clone.
The final offline maps must feel like one cohesive Rideclub cockpit.
# 36 — MAP ENGINE
Define the MapLibre as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the MapLibre benefits from geographic awareness.
Use a restrained near-black foundation behind the MapLibre.
Use #F4F7FA for primary readable values in the MapLibre.
Use #AAB1BD for supporting labels in the MapLibre.
Use #66707D for low-priority metadata in the MapLibre.
Use #FF4D21 only for Rideclub-primary actions in the MapLibre.
Use cyan for live communication state when applicable to the MapLibre.
Use green for successful or healthy state when applicable to the MapLibre.
Use amber for caution state when applicable to the MapLibre.
Use red only for critical state when applicable to the MapLibre.
Use technical typography for telemetry values associated with the MapLibre.
Use human-readable typography for rider-facing copy associated with the MapLibre.
Avoid unnecessary rounded rectangles in the MapLibre.
Avoid placing every datum inside its own container in the MapLibre.
Use one-pixel structural rules when the MapLibre needs visual grouping.
Use negative space as the first grouping mechanism in the MapLibre.
Use radial geometry when the MapLibre represents a measurable quantity.
Use nodes when the MapLibre represents people or geographic entities.
Use lines when the MapLibre represents a relationship or sequence.
Use rings when the MapLibre represents progress, cohesion, or capacity.
Use large numerals when the MapLibre contains a primary metric.
Use compact labels when the MapLibre contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive MapLibre controls.
Provide a larger sixty-four-pixel interaction zone for the most important MapLibre action during riding.
Do not require precise tapping for critical MapLibre actions.
Use hold-to-confirm for irreversible or safety-sensitive MapLibre actions where appropriate.
Provide immediate visual feedback for every interactive MapLibre action.
Animate the MapLibre only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the MapLibre.
Use sixty-to-two-hundred-fifty millisecond transitions for normal MapLibre UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the MapLibre.
Use opacity changes to establish secondary hierarchy in the MapLibre.
Use scale changes sparingly in the MapLibre.
Avoid large bounce animations in the MapLibre.
Use subtle glow to indicate active state in the MapLibre.
Never use glow as the only indicator of an important MapLibre state.
Pair important MapLibre states with text, iconography, or geometry.
Preserve the visual hierarchy of the MapLibre under reduced-motion settings.
Ensure the MapLibre remains understandable without animation.
Ensure the MapLibre remains usable at high text zoom.
Ensure the MapLibre remains usable in strong outdoor light where possible.
Use high contrast between the MapLibre primary value and its background.
Do not use tiny gray text for essential MapLibre information.
Keep secondary MapLibre information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the MapLibre.
Use uppercase tracking only for short telemetry labels in the MapLibre.
Use tabular numerals for changing MapLibre values.
Keep decimal precision consistent across the MapLibre.
Use locale-aware formatting for distance and speed in the MapLibre.
Use metric units by default for the MapLibre when the user is in a metric locale.
Allow unit preferences to be changed in settings for the MapLibre.
Use safe-area insets around the MapLibre on mobile devices.
Keep important MapLibre content away from gesture navigation edges.
Support landscape orientation for riding-focused MapLibre screens.
Support portrait orientation for planning-focused MapLibre screens.
Allow the MapLibre to reorganize rather than simply shrink at smaller widths.
Do not stack every MapLibre element vertically on mobile.
Use edge rails for compact MapLibre telemetry on narrow screens.
Use bottom sheets only when the MapLibre needs temporary detailed interaction.
Avoid permanent bottom sheets for the MapLibre unless the screen is specifically designed around one.
Keep map gestures available whenever the MapLibre does not require modal focus.
Prevent accidental map gestures while interacting with critical MapLibre controls.
Use pointer-events layering intentionally for the MapLibre.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the MapLibre.
Use MapLibre layers for geographic information whenever possible for the MapLibre.
Use DOM overlays only for interaction-heavy MapLibre controls.
Keep route geometry visually dominant over secondary map labels in the MapLibre.
Dim irrelevant map detail behind active MapLibre guidance.
Use a clear active route line for the MapLibre.
Use a thinner inactive route line for alternate MapLibre paths.
Use checkpoint nodes to divide long MapLibre journeys into understandable segments.
Use start and destination markers consistently in the MapLibre.
Use directional orientation for moving rider markers in the MapLibre.
Avoid using generic pins for every MapLibre object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the MapLibre.
Use clustering when many MapLibre entities overlap.
Use expansion behavior when a MapLibre cluster is selected.
Use proximity to determine emphasis for nearby MapLibre entities.
Use distance labels only when distance is actionable for the MapLibre.
Use live state indicators for connected MapLibre entities.
Use stale-state indicators when MapLibre data has not updated recently.
Never imply live MapLibre data when the network is offline.
Clearly communicate offline state within the MapLibre.
Use cached data gracefully for the MapLibre.
Design the MapLibre to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the MapLibre.
Show network state without turning the MapLibre into a diagnostic screen.
Keep system diagnostics secondary to the MapLibre user goal.
Use haptic-ready interaction semantics for the MapLibre where supported.
Use sound-ready states for the MapLibre where auditory feedback is useful.
Do not make sound the only indication of a critical MapLibre state.
Use clear visual acknowledgment after the MapLibre receives an action.
Use optimistic feedback only when the MapLibre action can safely be reversed.
Use progress indicators for long-running MapLibre operations.
Use skeletons only when they help preserve the MapLibre layout.
Avoid generic spinner-only loading states for major MapLibre screens.
Provide purposeful empty states for the MapLibre.
Provide recovery actions for MapLibre errors.
Keep error messages concise and actionable in the MapLibre.
Use a technical but human tone for MapLibre system messages.
Never use jargon that the rider cannot understand in the MapLibre.
Keep safety-critical copy direct and unambiguous in the MapLibre.
Validate the MapLibre at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the MapLibre at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the MapLibre in both portrait and landscape layouts.
Validate the MapLibre with long rider names.
Validate the MapLibre with long route names.
Validate the MapLibre with zero riders.
Validate the MapLibre with one rider.
Validate the MapLibre with a full group.
Validate the MapLibre with slow network conditions.
Validate the MapLibre with no network.
Validate the MapLibre with poor GPS accuracy.
Validate the MapLibre with rapidly changing telemetry.
Validate the MapLibre with accessibility text scaling.
Validate the MapLibre with reduced motion.
Validate the MapLibre with keyboard navigation where applicable.
Validate the MapLibre with screen readers for non-driving planning contexts.
Validate the MapLibre with touch and pointer input.
Validate the MapLibre with glove-friendly target sizing.
Document every interactive state of the MapLibre.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the MapLibre.
Create a reusable component contract for the MapLibre.
Keep component APIs semantic rather than visual-only for the MapLibre.
Separate data state from presentation state in the MapLibre.
Keep animation state separate from business state in the MapLibre.
Avoid hardcoding user-specific values into the MapLibre.
Drive MapLibre values from the application's data layer.
Keep the MapLibre resilient to missing optional data.
Keep the MapLibre deterministic during replay or ride-history inspection.
Use consistent time formatting across the MapLibre.
Use consistent distance formatting across the MapLibre.
Use consistent rider status terminology across the MapLibre.
Use consistent alert severity terminology across the MapLibre.
Use consistent route terminology across the MapLibre.
Use consistent checkpoint terminology across the MapLibre.
Use consistent connection terminology across the MapLibre.
Do not introduce a new visual pattern for the MapLibre if an existing pattern already solves the same problem.
Prefer composition over component nesting in the MapLibre.
Keep the visual surface of the MapLibre calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary MapLibre information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the MapLibre.
Use the reference HMI's instrument-panel logic as inspiration for the MapLibre.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the MapLibre feel native to Rideclub's spatial operating-system concept.
The final MapLibre must not look like a generic admin dashboard.
The final MapLibre must not look like a generic fintech dashboard.
The final MapLibre must not look like a generic social feed.
The final MapLibre must not look like a generic navigation clone.
The final MapLibre must feel like one cohesive Rideclub cockpit.
# 37 — MAP LAYERS
Define the map layers as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the map layers benefits from geographic awareness.
Use a restrained near-black foundation behind the map layers.
Use #F4F7FA for primary readable values in the map layers.
Use #AAB1BD for supporting labels in the map layers.
Use #66707D for low-priority metadata in the map layers.
Use #FF4D21 only for Rideclub-primary actions in the map layers.
Use cyan for live communication state when applicable to the map layers.
Use green for successful or healthy state when applicable to the map layers.
Use amber for caution state when applicable to the map layers.
Use red only for critical state when applicable to the map layers.
Use technical typography for telemetry values associated with the map layers.
Use human-readable typography for rider-facing copy associated with the map layers.
Avoid unnecessary rounded rectangles in the map layers.
Avoid placing every datum inside its own container in the map layers.
Use one-pixel structural rules when the map layers needs visual grouping.
Use negative space as the first grouping mechanism in the map layers.
Use radial geometry when the map layers represents a measurable quantity.
Use nodes when the map layers represents people or geographic entities.
Use lines when the map layers represents a relationship or sequence.
Use rings when the map layers represents progress, cohesion, or capacity.
Use large numerals when the map layers contains a primary metric.
Use compact labels when the map layers contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive map layers controls.
Provide a larger sixty-four-pixel interaction zone for the most important map layers action during riding.
Do not require precise tapping for critical map layers actions.
Use hold-to-confirm for irreversible or safety-sensitive map layers actions where appropriate.
Provide immediate visual feedback for every interactive map layers action.
Animate the map layers only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the map layers.
Use sixty-to-two-hundred-fifty millisecond transitions for normal map layers UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the map layers.
Use opacity changes to establish secondary hierarchy in the map layers.
Use scale changes sparingly in the map layers.
Avoid large bounce animations in the map layers.
Use subtle glow to indicate active state in the map layers.
Never use glow as the only indicator of an important map layers state.
Pair important map layers states with text, iconography, or geometry.
Preserve the visual hierarchy of the map layers under reduced-motion settings.
Ensure the map layers remains understandable without animation.
Ensure the map layers remains usable at high text zoom.
Ensure the map layers remains usable in strong outdoor light where possible.
Use high contrast between the map layers primary value and its background.
Do not use tiny gray text for essential map layers information.
Keep secondary map layers information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the map layers.
Use uppercase tracking only for short telemetry labels in the map layers.
Use tabular numerals for changing map layers values.
Keep decimal precision consistent across the map layers.
Use locale-aware formatting for distance and speed in the map layers.
Use metric units by default for the map layers when the user is in a metric locale.
Allow unit preferences to be changed in settings for the map layers.
Use safe-area insets around the map layers on mobile devices.
Keep important map layers content away from gesture navigation edges.
Support landscape orientation for riding-focused map layers screens.
Support portrait orientation for planning-focused map layers screens.
Allow the map layers to reorganize rather than simply shrink at smaller widths.
Do not stack every map layers element vertically on mobile.
Use edge rails for compact map layers telemetry on narrow screens.
Use bottom sheets only when the map layers needs temporary detailed interaction.
Avoid permanent bottom sheets for the map layers unless the screen is specifically designed around one.
Keep map gestures available whenever the map layers does not require modal focus.
Prevent accidental map gestures while interacting with critical map layers controls.
Use pointer-events layering intentionally for the map layers.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the map layers.
Use MapLibre layers for geographic information whenever possible for the map layers.
Use DOM overlays only for interaction-heavy map layers controls.
Keep route geometry visually dominant over secondary map labels in the map layers.
Dim irrelevant map detail behind active map layers guidance.
Use a clear active route line for the map layers.
Use a thinner inactive route line for alternate map layers paths.
Use checkpoint nodes to divide long map layers journeys into understandable segments.
Use start and destination markers consistently in the map layers.
Use directional orientation for moving rider markers in the map layers.
Avoid using generic pins for every map layers object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the map layers.
Use clustering when many map layers entities overlap.
Use expansion behavior when a map layers cluster is selected.
Use proximity to determine emphasis for nearby map layers entities.
Use distance labels only when distance is actionable for the map layers.
Use live state indicators for connected map layers entities.
Use stale-state indicators when map layers data has not updated recently.
Never imply live map layers data when the network is offline.
Clearly communicate offline state within the map layers.
Use cached data gracefully for the map layers.
Design the map layers to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the map layers.
Show network state without turning the map layers into a diagnostic screen.
Keep system diagnostics secondary to the map layers user goal.
Use haptic-ready interaction semantics for the map layers where supported.
Use sound-ready states for the map layers where auditory feedback is useful.
Do not make sound the only indication of a critical map layers state.
Use clear visual acknowledgment after the map layers receives an action.
Use optimistic feedback only when the map layers action can safely be reversed.
Use progress indicators for long-running map layers operations.
Use skeletons only when they help preserve the map layers layout.
Avoid generic spinner-only loading states for major map layers screens.
Provide purposeful empty states for the map layers.
Provide recovery actions for map layers errors.
Keep error messages concise and actionable in the map layers.
Use a technical but human tone for map layers system messages.
Never use jargon that the rider cannot understand in the map layers.
Keep safety-critical copy direct and unambiguous in the map layers.
Validate the map layers at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the map layers at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the map layers in both portrait and landscape layouts.
Validate the map layers with long rider names.
Validate the map layers with long route names.
Validate the map layers with zero riders.
Validate the map layers with one rider.
Validate the map layers with a full group.
Validate the map layers with slow network conditions.
Validate the map layers with no network.
Validate the map layers with poor GPS accuracy.
Validate the map layers with rapidly changing telemetry.
Validate the map layers with accessibility text scaling.
Validate the map layers with reduced motion.
Validate the map layers with keyboard navigation where applicable.
Validate the map layers with screen readers for non-driving planning contexts.
Validate the map layers with touch and pointer input.
Validate the map layers with glove-friendly target sizing.
Document every interactive state of the map layers.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the map layers.
Create a reusable component contract for the map layers.
Keep component APIs semantic rather than visual-only for the map layers.
Separate data state from presentation state in the map layers.
Keep animation state separate from business state in the map layers.
Avoid hardcoding user-specific values into the map layers.
Drive map layers values from the application's data layer.
Keep the map layers resilient to missing optional data.
Keep the map layers deterministic during replay or ride-history inspection.
Use consistent time formatting across the map layers.
Use consistent distance formatting across the map layers.
Use consistent rider status terminology across the map layers.
Use consistent alert severity terminology across the map layers.
Use consistent route terminology across the map layers.
Use consistent checkpoint terminology across the map layers.
Use consistent connection terminology across the map layers.
Do not introduce a new visual pattern for the map layers if an existing pattern already solves the same problem.
Prefer composition over component nesting in the map layers.
Keep the visual surface of the map layers calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary map layers information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the map layers.
Use the reference HMI's instrument-panel logic as inspiration for the map layers.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the map layers feel native to Rideclub's spatial operating-system concept.
The final map layers must not look like a generic admin dashboard.
The final map layers must not look like a generic fintech dashboard.
The final map layers must not look like a generic social feed.
The final map layers must not look like a generic navigation clone.
The final map layers must feel like one cohesive Rideclub cockpit.
# 38 — MAP MARKERS
Define the map markers as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the map markers benefits from geographic awareness.
Use a restrained near-black foundation behind the map markers.
Use #F4F7FA for primary readable values in the map markers.
Use #AAB1BD for supporting labels in the map markers.
Use #66707D for low-priority metadata in the map markers.
Use #FF4D21 only for Rideclub-primary actions in the map markers.
Use cyan for live communication state when applicable to the map markers.
Use green for successful or healthy state when applicable to the map markers.
Use amber for caution state when applicable to the map markers.
Use red only for critical state when applicable to the map markers.
Use technical typography for telemetry values associated with the map markers.
Use human-readable typography for rider-facing copy associated with the map markers.
Avoid unnecessary rounded rectangles in the map markers.
Avoid placing every datum inside its own container in the map markers.
Use one-pixel structural rules when the map markers needs visual grouping.
Use negative space as the first grouping mechanism in the map markers.
Use radial geometry when the map markers represents a measurable quantity.
Use nodes when the map markers represents people or geographic entities.
Use lines when the map markers represents a relationship or sequence.
Use rings when the map markers represents progress, cohesion, or capacity.
Use large numerals when the map markers contains a primary metric.
Use compact labels when the map markers contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive map markers controls.
Provide a larger sixty-four-pixel interaction zone for the most important map markers action during riding.
Do not require precise tapping for critical map markers actions.
Use hold-to-confirm for irreversible or safety-sensitive map markers actions where appropriate.
Provide immediate visual feedback for every interactive map markers action.
Animate the map markers only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the map markers.
Use sixty-to-two-hundred-fifty millisecond transitions for normal map markers UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the map markers.
Use opacity changes to establish secondary hierarchy in the map markers.
Use scale changes sparingly in the map markers.
Avoid large bounce animations in the map markers.
Use subtle glow to indicate active state in the map markers.
Never use glow as the only indicator of an important map markers state.
Pair important map markers states with text, iconography, or geometry.
Preserve the visual hierarchy of the map markers under reduced-motion settings.
Ensure the map markers remains understandable without animation.
Ensure the map markers remains usable at high text zoom.
Ensure the map markers remains usable in strong outdoor light where possible.
Use high contrast between the map markers primary value and its background.
Do not use tiny gray text for essential map markers information.
Keep secondary map markers information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the map markers.
Use uppercase tracking only for short telemetry labels in the map markers.
Use tabular numerals for changing map markers values.
Keep decimal precision consistent across the map markers.
Use locale-aware formatting for distance and speed in the map markers.
Use metric units by default for the map markers when the user is in a metric locale.
Allow unit preferences to be changed in settings for the map markers.
Use safe-area insets around the map markers on mobile devices.
Keep important map markers content away from gesture navigation edges.
Support landscape orientation for riding-focused map markers screens.
Support portrait orientation for planning-focused map markers screens.
Allow the map markers to reorganize rather than simply shrink at smaller widths.
Do not stack every map markers element vertically on mobile.
Use edge rails for compact map markers telemetry on narrow screens.
Use bottom sheets only when the map markers needs temporary detailed interaction.
Avoid permanent bottom sheets for the map markers unless the screen is specifically designed around one.
Keep map gestures available whenever the map markers does not require modal focus.
Prevent accidental map gestures while interacting with critical map markers controls.
Use pointer-events layering intentionally for the map markers.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the map markers.
Use MapLibre layers for geographic information whenever possible for the map markers.
Use DOM overlays only for interaction-heavy map markers controls.
Keep route geometry visually dominant over secondary map labels in the map markers.
Dim irrelevant map detail behind active map markers guidance.
Use a clear active route line for the map markers.
Use a thinner inactive route line for alternate map markers paths.
Use checkpoint nodes to divide long map markers journeys into understandable segments.
Use start and destination markers consistently in the map markers.
Use directional orientation for moving rider markers in the map markers.
Avoid using generic pins for every map markers object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the map markers.
Use clustering when many map markers entities overlap.
Use expansion behavior when a map markers cluster is selected.
Use proximity to determine emphasis for nearby map markers entities.
Use distance labels only when distance is actionable for the map markers.
Use live state indicators for connected map markers entities.
Use stale-state indicators when map markers data has not updated recently.
Never imply live map markers data when the network is offline.
Clearly communicate offline state within the map markers.
Use cached data gracefully for the map markers.
Design the map markers to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the map markers.
Show network state without turning the map markers into a diagnostic screen.
Keep system diagnostics secondary to the map markers user goal.
Use haptic-ready interaction semantics for the map markers where supported.
Use sound-ready states for the map markers where auditory feedback is useful.
Do not make sound the only indication of a critical map markers state.
Use clear visual acknowledgment after the map markers receives an action.
Use optimistic feedback only when the map markers action can safely be reversed.
Use progress indicators for long-running map markers operations.
Use skeletons only when they help preserve the map markers layout.
Avoid generic spinner-only loading states for major map markers screens.
Provide purposeful empty states for the map markers.
Provide recovery actions for map markers errors.
Keep error messages concise and actionable in the map markers.
Use a technical but human tone for map markers system messages.
Never use jargon that the rider cannot understand in the map markers.
Keep safety-critical copy direct and unambiguous in the map markers.
Validate the map markers at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the map markers at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the map markers in both portrait and landscape layouts.
Validate the map markers with long rider names.
Validate the map markers with long route names.
Validate the map markers with zero riders.
Validate the map markers with one rider.
Validate the map markers with a full group.
Validate the map markers with slow network conditions.
Validate the map markers with no network.
Validate the map markers with poor GPS accuracy.
Validate the map markers with rapidly changing telemetry.
Validate the map markers with accessibility text scaling.
Validate the map markers with reduced motion.
Validate the map markers with keyboard navigation where applicable.
Validate the map markers with screen readers for non-driving planning contexts.
Validate the map markers with touch and pointer input.
Validate the map markers with glove-friendly target sizing.
Document every interactive state of the map markers.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the map markers.
Create a reusable component contract for the map markers.
Keep component APIs semantic rather than visual-only for the map markers.
Separate data state from presentation state in the map markers.
Keep animation state separate from business state in the map markers.
Avoid hardcoding user-specific values into the map markers.
Drive map markers values from the application's data layer.
Keep the map markers resilient to missing optional data.
Keep the map markers deterministic during replay or ride-history inspection.
Use consistent time formatting across the map markers.
Use consistent distance formatting across the map markers.
Use consistent rider status terminology across the map markers.
Use consistent alert severity terminology across the map markers.
Use consistent route terminology across the map markers.
Use consistent checkpoint terminology across the map markers.
Use consistent connection terminology across the map markers.
Do not introduce a new visual pattern for the map markers if an existing pattern already solves the same problem.
Prefer composition over component nesting in the map markers.
Keep the visual surface of the map markers calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary map markers information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the map markers.
Use the reference HMI's instrument-panel logic as inspiration for the map markers.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the map markers feel native to Rideclub's spatial operating-system concept.
The final map markers must not look like a generic admin dashboard.
The final map markers must not look like a generic fintech dashboard.
The final map markers must not look like a generic social feed.
The final map markers must not look like a generic navigation clone.
The final map markers must feel like one cohesive Rideclub cockpit.
# 39 — ROUTE VISUALIZATION
Define the route visualization as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the route visualization benefits from geographic awareness.
Use a restrained near-black foundation behind the route visualization.
Use #F4F7FA for primary readable values in the route visualization.
Use #AAB1BD for supporting labels in the route visualization.
Use #66707D for low-priority metadata in the route visualization.
Use #FF4D21 only for Rideclub-primary actions in the route visualization.
Use cyan for live communication state when applicable to the route visualization.
Use green for successful or healthy state when applicable to the route visualization.
Use amber for caution state when applicable to the route visualization.
Use red only for critical state when applicable to the route visualization.
Use technical typography for telemetry values associated with the route visualization.
Use human-readable typography for rider-facing copy associated with the route visualization.
Avoid unnecessary rounded rectangles in the route visualization.
Avoid placing every datum inside its own container in the route visualization.
Use one-pixel structural rules when the route visualization needs visual grouping.
Use negative space as the first grouping mechanism in the route visualization.
Use radial geometry when the route visualization represents a measurable quantity.
Use nodes when the route visualization represents people or geographic entities.
Use lines when the route visualization represents a relationship or sequence.
Use rings when the route visualization represents progress, cohesion, or capacity.
Use large numerals when the route visualization contains a primary metric.
Use compact labels when the route visualization contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive route visualization controls.
Provide a larger sixty-four-pixel interaction zone for the most important route visualization action during riding.
Do not require precise tapping for critical route visualization actions.
Use hold-to-confirm for irreversible or safety-sensitive route visualization actions where appropriate.
Provide immediate visual feedback for every interactive route visualization action.
Animate the route visualization only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the route visualization.
Use sixty-to-two-hundred-fifty millisecond transitions for normal route visualization UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the route visualization.
Use opacity changes to establish secondary hierarchy in the route visualization.
Use scale changes sparingly in the route visualization.
Avoid large bounce animations in the route visualization.
Use subtle glow to indicate active state in the route visualization.
Never use glow as the only indicator of an important route visualization state.
Pair important route visualization states with text, iconography, or geometry.
Preserve the visual hierarchy of the route visualization under reduced-motion settings.
Ensure the route visualization remains understandable without animation.
Ensure the route visualization remains usable at high text zoom.
Ensure the route visualization remains usable in strong outdoor light where possible.
Use high contrast between the route visualization primary value and its background.
Do not use tiny gray text for essential route visualization information.
Keep secondary route visualization information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the route visualization.
Use uppercase tracking only for short telemetry labels in the route visualization.
Use tabular numerals for changing route visualization values.
Keep decimal precision consistent across the route visualization.
Use locale-aware formatting for distance and speed in the route visualization.
Use metric units by default for the route visualization when the user is in a metric locale.
Allow unit preferences to be changed in settings for the route visualization.
Use safe-area insets around the route visualization on mobile devices.
Keep important route visualization content away from gesture navigation edges.
Support landscape orientation for riding-focused route visualization screens.
Support portrait orientation for planning-focused route visualization screens.
Allow the route visualization to reorganize rather than simply shrink at smaller widths.
Do not stack every route visualization element vertically on mobile.
Use edge rails for compact route visualization telemetry on narrow screens.
Use bottom sheets only when the route visualization needs temporary detailed interaction.
Avoid permanent bottom sheets for the route visualization unless the screen is specifically designed around one.
Keep map gestures available whenever the route visualization does not require modal focus.
Prevent accidental map gestures while interacting with critical route visualization controls.
Use pointer-events layering intentionally for the route visualization.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the route visualization.
Use MapLibre layers for geographic information whenever possible for the route visualization.
Use DOM overlays only for interaction-heavy route visualization controls.
Keep route geometry visually dominant over secondary map labels in the route visualization.
Dim irrelevant map detail behind active route visualization guidance.
Use a clear active route line for the route visualization.
Use a thinner inactive route line for alternate route visualization paths.
Use checkpoint nodes to divide long route visualization journeys into understandable segments.
Use start and destination markers consistently in the route visualization.
Use directional orientation for moving rider markers in the route visualization.
Avoid using generic pins for every route visualization object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the route visualization.
Use clustering when many route visualization entities overlap.
Use expansion behavior when a route visualization cluster is selected.
Use proximity to determine emphasis for nearby route visualization entities.
Use distance labels only when distance is actionable for the route visualization.
Use live state indicators for connected route visualization entities.
Use stale-state indicators when route visualization data has not updated recently.
Never imply live route visualization data when the network is offline.
Clearly communicate offline state within the route visualization.
Use cached data gracefully for the route visualization.
Design the route visualization to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the route visualization.
Show network state without turning the route visualization into a diagnostic screen.
Keep system diagnostics secondary to the route visualization user goal.
Use haptic-ready interaction semantics for the route visualization where supported.
Use sound-ready states for the route visualization where auditory feedback is useful.
Do not make sound the only indication of a critical route visualization state.
Use clear visual acknowledgment after the route visualization receives an action.
Use optimistic feedback only when the route visualization action can safely be reversed.
Use progress indicators for long-running route visualization operations.
Use skeletons only when they help preserve the route visualization layout.
Avoid generic spinner-only loading states for major route visualization screens.
Provide purposeful empty states for the route visualization.
Provide recovery actions for route visualization errors.
Keep error messages concise and actionable in the route visualization.
Use a technical but human tone for route visualization system messages.
Never use jargon that the rider cannot understand in the route visualization.
Keep safety-critical copy direct and unambiguous in the route visualization.
Validate the route visualization at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the route visualization at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the route visualization in both portrait and landscape layouts.
Validate the route visualization with long rider names.
Validate the route visualization with long route names.
Validate the route visualization with zero riders.
Validate the route visualization with one rider.
Validate the route visualization with a full group.
Validate the route visualization with slow network conditions.
Validate the route visualization with no network.
Validate the route visualization with poor GPS accuracy.
Validate the route visualization with rapidly changing telemetry.
Validate the route visualization with accessibility text scaling.
Validate the route visualization with reduced motion.
Validate the route visualization with keyboard navigation where applicable.
Validate the route visualization with screen readers for non-driving planning contexts.
Validate the route visualization with touch and pointer input.
Validate the route visualization with glove-friendly target sizing.
Document every interactive state of the route visualization.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the route visualization.
Create a reusable component contract for the route visualization.
Keep component APIs semantic rather than visual-only for the route visualization.
Separate data state from presentation state in the route visualization.
Keep animation state separate from business state in the route visualization.
Avoid hardcoding user-specific values into the route visualization.
Drive route visualization values from the application's data layer.
Keep the route visualization resilient to missing optional data.
Keep the route visualization deterministic during replay or ride-history inspection.
Use consistent time formatting across the route visualization.
Use consistent distance formatting across the route visualization.
Use consistent rider status terminology across the route visualization.
Use consistent alert severity terminology across the route visualization.
Use consistent route terminology across the route visualization.
Use consistent checkpoint terminology across the route visualization.
Use consistent connection terminology across the route visualization.
Do not introduce a new visual pattern for the route visualization if an existing pattern already solves the same problem.
Prefer composition over component nesting in the route visualization.
Keep the visual surface of the route visualization calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary route visualization information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the route visualization.
Use the reference HMI's instrument-panel logic as inspiration for the route visualization.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the route visualization feel native to Rideclub's spatial operating-system concept.
The final route visualization must not look like a generic admin dashboard.
The final route visualization must not look like a generic fintech dashboard.
The final route visualization must not look like a generic social feed.
The final route visualization must not look like a generic navigation clone.
The final route visualization must feel like one cohesive Rideclub cockpit.
# 40 — ROUTE STATES
Define the route states as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the route states benefits from geographic awareness.
Use a restrained near-black foundation behind the route states.
Use #F4F7FA for primary readable values in the route states.
Use #AAB1BD for supporting labels in the route states.
Use #66707D for low-priority metadata in the route states.
Use #FF4D21 only for Rideclub-primary actions in the route states.
Use cyan for live communication state when applicable to the route states.
Use green for successful or healthy state when applicable to the route states.
Use amber for caution state when applicable to the route states.
Use red only for critical state when applicable to the route states.
Use technical typography for telemetry values associated with the route states.
Use human-readable typography for rider-facing copy associated with the route states.
Avoid unnecessary rounded rectangles in the route states.
Avoid placing every datum inside its own container in the route states.
Use one-pixel structural rules when the route states needs visual grouping.
Use negative space as the first grouping mechanism in the route states.
Use radial geometry when the route states represents a measurable quantity.
Use nodes when the route states represents people or geographic entities.
Use lines when the route states represents a relationship or sequence.
Use rings when the route states represents progress, cohesion, or capacity.
Use large numerals when the route states contains a primary metric.
Use compact labels when the route states contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive route states controls.
Provide a larger sixty-four-pixel interaction zone for the most important route states action during riding.
Do not require precise tapping for critical route states actions.
Use hold-to-confirm for irreversible or safety-sensitive route states actions where appropriate.
Provide immediate visual feedback for every interactive route states action.
Animate the route states only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the route states.
Use sixty-to-two-hundred-fifty millisecond transitions for normal route states UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the route states.
Use opacity changes to establish secondary hierarchy in the route states.
Use scale changes sparingly in the route states.
Avoid large bounce animations in the route states.
Use subtle glow to indicate active state in the route states.
Never use glow as the only indicator of an important route states state.
Pair important route states states with text, iconography, or geometry.
Preserve the visual hierarchy of the route states under reduced-motion settings.
Ensure the route states remains understandable without animation.
Ensure the route states remains usable at high text zoom.
Ensure the route states remains usable in strong outdoor light where possible.
Use high contrast between the route states primary value and its background.
Do not use tiny gray text for essential route states information.
Keep secondary route states information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the route states.
Use uppercase tracking only for short telemetry labels in the route states.
Use tabular numerals for changing route states values.
Keep decimal precision consistent across the route states.
Use locale-aware formatting for distance and speed in the route states.
Use metric units by default for the route states when the user is in a metric locale.
Allow unit preferences to be changed in settings for the route states.
Use safe-area insets around the route states on mobile devices.
Keep important route states content away from gesture navigation edges.
Support landscape orientation for riding-focused route states screens.
Support portrait orientation for planning-focused route states screens.
Allow the route states to reorganize rather than simply shrink at smaller widths.
Do not stack every route states element vertically on mobile.
Use edge rails for compact route states telemetry on narrow screens.
Use bottom sheets only when the route states needs temporary detailed interaction.
Avoid permanent bottom sheets for the route states unless the screen is specifically designed around one.
Keep map gestures available whenever the route states does not require modal focus.
Prevent accidental map gestures while interacting with critical route states controls.
Use pointer-events layering intentionally for the route states.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the route states.
Use MapLibre layers for geographic information whenever possible for the route states.
Use DOM overlays only for interaction-heavy route states controls.
Keep route geometry visually dominant over secondary map labels in the route states.
Dim irrelevant map detail behind active route states guidance.
Use a clear active route line for the route states.
Use a thinner inactive route line for alternate route states paths.
Use checkpoint nodes to divide long route states journeys into understandable segments.
Use start and destination markers consistently in the route states.
Use directional orientation for moving rider markers in the route states.
Avoid using generic pins for every route states object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the route states.
Use clustering when many route states entities overlap.
Use expansion behavior when a route states cluster is selected.
Use proximity to determine emphasis for nearby route states entities.
Use distance labels only when distance is actionable for the route states.
Use live state indicators for connected route states entities.
Use stale-state indicators when route states data has not updated recently.
Never imply live route states data when the network is offline.
Clearly communicate offline state within the route states.
Use cached data gracefully for the route states.
Design the route states to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the route states.
Show network state without turning the route states into a diagnostic screen.
Keep system diagnostics secondary to the route states user goal.
Use haptic-ready interaction semantics for the route states where supported.
Use sound-ready states for the route states where auditory feedback is useful.
Do not make sound the only indication of a critical route states state.
Use clear visual acknowledgment after the route states receives an action.
Use optimistic feedback only when the route states action can safely be reversed.
Use progress indicators for long-running route states operations.
Use skeletons only when they help preserve the route states layout.
Avoid generic spinner-only loading states for major route states screens.
Provide purposeful empty states for the route states.
Provide recovery actions for route states errors.
Keep error messages concise and actionable in the route states.
Use a technical but human tone for route states system messages.
Never use jargon that the rider cannot understand in the route states.
Keep safety-critical copy direct and unambiguous in the route states.
Validate the route states at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the route states at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the route states in both portrait and landscape layouts.
Validate the route states with long rider names.
Validate the route states with long route names.
Validate the route states with zero riders.
Validate the route states with one rider.
Validate the route states with a full group.
Validate the route states with slow network conditions.
Validate the route states with no network.
Validate the route states with poor GPS accuracy.
Validate the route states with rapidly changing telemetry.
Validate the route states with accessibility text scaling.
Validate the route states with reduced motion.
Validate the route states with keyboard navigation where applicable.
Validate the route states with screen readers for non-driving planning contexts.
Validate the route states with touch and pointer input.
Validate the route states with glove-friendly target sizing.
Document every interactive state of the route states.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the route states.
Create a reusable component contract for the route states.
Keep component APIs semantic rather than visual-only for the route states.
Separate data state from presentation state in the route states.
Keep animation state separate from business state in the route states.
Avoid hardcoding user-specific values into the route states.
Drive route states values from the application's data layer.
Keep the route states resilient to missing optional data.
Keep the route states deterministic during replay or ride-history inspection.
Use consistent time formatting across the route states.
Use consistent distance formatting across the route states.
Use consistent rider status terminology across the route states.
Use consistent alert severity terminology across the route states.
Use consistent route terminology across the route states.
Use consistent checkpoint terminology across the route states.
Use consistent connection terminology across the route states.
Do not introduce a new visual pattern for the route states if an existing pattern already solves the same problem.
Prefer composition over component nesting in the route states.
Keep the visual surface of the route states calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary route states information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the route states.
Use the reference HMI's instrument-panel logic as inspiration for the route states.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the route states feel native to Rideclub's spatial operating-system concept.
The final route states must not look like a generic admin dashboard.
The final route states must not look like a generic fintech dashboard.
The final route states must not look like a generic social feed.
The final route states must not look like a generic navigation clone.
The final route states must feel like one cohesive Rideclub cockpit.
# 41 — RIDER MARKERS
Define the rider markers as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the rider markers benefits from geographic awareness.
Use a restrained near-black foundation behind the rider markers.
Use #F4F7FA for primary readable values in the rider markers.
Use #AAB1BD for supporting labels in the rider markers.
Use #66707D for low-priority metadata in the rider markers.
Use #FF4D21 only for Rideclub-primary actions in the rider markers.
Use cyan for live communication state when applicable to the rider markers.
Use green for successful or healthy state when applicable to the rider markers.
Use amber for caution state when applicable to the rider markers.
Use red only for critical state when applicable to the rider markers.
Use technical typography for telemetry values associated with the rider markers.
Use human-readable typography for rider-facing copy associated with the rider markers.
Avoid unnecessary rounded rectangles in the rider markers.
Avoid placing every datum inside its own container in the rider markers.
Use one-pixel structural rules when the rider markers needs visual grouping.
Use negative space as the first grouping mechanism in the rider markers.
Use radial geometry when the rider markers represents a measurable quantity.
Use nodes when the rider markers represents people or geographic entities.
Use lines when the rider markers represents a relationship or sequence.
Use rings when the rider markers represents progress, cohesion, or capacity.
Use large numerals when the rider markers contains a primary metric.
Use compact labels when the rider markers contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive rider markers controls.
Provide a larger sixty-four-pixel interaction zone for the most important rider markers action during riding.
Do not require precise tapping for critical rider markers actions.
Use hold-to-confirm for irreversible or safety-sensitive rider markers actions where appropriate.
Provide immediate visual feedback for every interactive rider markers action.
Animate the rider markers only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the rider markers.
Use sixty-to-two-hundred-fifty millisecond transitions for normal rider markers UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the rider markers.
Use opacity changes to establish secondary hierarchy in the rider markers.
Use scale changes sparingly in the rider markers.
Avoid large bounce animations in the rider markers.
Use subtle glow to indicate active state in the rider markers.
Never use glow as the only indicator of an important rider markers state.
Pair important rider markers states with text, iconography, or geometry.
Preserve the visual hierarchy of the rider markers under reduced-motion settings.
Ensure the rider markers remains understandable without animation.
Ensure the rider markers remains usable at high text zoom.
Ensure the rider markers remains usable in strong outdoor light where possible.
Use high contrast between the rider markers primary value and its background.
Do not use tiny gray text for essential rider markers information.
Keep secondary rider markers information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the rider markers.
Use uppercase tracking only for short telemetry labels in the rider markers.
Use tabular numerals for changing rider markers values.
Keep decimal precision consistent across the rider markers.
Use locale-aware formatting for distance and speed in the rider markers.
Use metric units by default for the rider markers when the user is in a metric locale.
Allow unit preferences to be changed in settings for the rider markers.
Use safe-area insets around the rider markers on mobile devices.
Keep important rider markers content away from gesture navigation edges.
Support landscape orientation for riding-focused rider markers screens.
Support portrait orientation for planning-focused rider markers screens.
Allow the rider markers to reorganize rather than simply shrink at smaller widths.
Do not stack every rider markers element vertically on mobile.
Use edge rails for compact rider markers telemetry on narrow screens.
Use bottom sheets only when the rider markers needs temporary detailed interaction.
Avoid permanent bottom sheets for the rider markers unless the screen is specifically designed around one.
Keep map gestures available whenever the rider markers does not require modal focus.
Prevent accidental map gestures while interacting with critical rider markers controls.
Use pointer-events layering intentionally for the rider markers.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the rider markers.
Use MapLibre layers for geographic information whenever possible for the rider markers.
Use DOM overlays only for interaction-heavy rider markers controls.
Keep route geometry visually dominant over secondary map labels in the rider markers.
Dim irrelevant map detail behind active rider markers guidance.
Use a clear active route line for the rider markers.
Use a thinner inactive route line for alternate rider markers paths.
Use checkpoint nodes to divide long rider markers journeys into understandable segments.
Use start and destination markers consistently in the rider markers.
Use directional orientation for moving rider markers in the rider markers.
Avoid using generic pins for every rider markers object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the rider markers.
Use clustering when many rider markers entities overlap.
Use expansion behavior when a rider markers cluster is selected.
Use proximity to determine emphasis for nearby rider markers entities.
Use distance labels only when distance is actionable for the rider markers.
Use live state indicators for connected rider markers entities.
Use stale-state indicators when rider markers data has not updated recently.
Never imply live rider markers data when the network is offline.
Clearly communicate offline state within the rider markers.
Use cached data gracefully for the rider markers.
Design the rider markers to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the rider markers.
Show network state without turning the rider markers into a diagnostic screen.
Keep system diagnostics secondary to the rider markers user goal.
Use haptic-ready interaction semantics for the rider markers where supported.
Use sound-ready states for the rider markers where auditory feedback is useful.
Do not make sound the only indication of a critical rider markers state.
Use clear visual acknowledgment after the rider markers receives an action.
Use optimistic feedback only when the rider markers action can safely be reversed.
Use progress indicators for long-running rider markers operations.
Use skeletons only when they help preserve the rider markers layout.
Avoid generic spinner-only loading states for major rider markers screens.
Provide purposeful empty states for the rider markers.
Provide recovery actions for rider markers errors.
Keep error messages concise and actionable in the rider markers.
Use a technical but human tone for rider markers system messages.
Never use jargon that the rider cannot understand in the rider markers.
Keep safety-critical copy direct and unambiguous in the rider markers.
Validate the rider markers at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the rider markers at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the rider markers in both portrait and landscape layouts.
Validate the rider markers with long rider names.
Validate the rider markers with long route names.
Validate the rider markers with zero riders.
Validate the rider markers with one rider.
Validate the rider markers with a full group.
Validate the rider markers with slow network conditions.
Validate the rider markers with no network.
Validate the rider markers with poor GPS accuracy.
Validate the rider markers with rapidly changing telemetry.
Validate the rider markers with accessibility text scaling.
Validate the rider markers with reduced motion.
Validate the rider markers with keyboard navigation where applicable.
Validate the rider markers with screen readers for non-driving planning contexts.
Validate the rider markers with touch and pointer input.
Validate the rider markers with glove-friendly target sizing.
Document every interactive state of the rider markers.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the rider markers.
Create a reusable component contract for the rider markers.
Keep component APIs semantic rather than visual-only for the rider markers.
Separate data state from presentation state in the rider markers.
Keep animation state separate from business state in the rider markers.
Avoid hardcoding user-specific values into the rider markers.
Drive rider markers values from the application's data layer.
Keep the rider markers resilient to missing optional data.
Keep the rider markers deterministic during replay or ride-history inspection.
Use consistent time formatting across the rider markers.
Use consistent distance formatting across the rider markers.
Use consistent rider status terminology across the rider markers.
Use consistent alert severity terminology across the rider markers.
Use consistent route terminology across the rider markers.
Use consistent checkpoint terminology across the rider markers.
Use consistent connection terminology across the rider markers.
Do not introduce a new visual pattern for the rider markers if an existing pattern already solves the same problem.
Prefer composition over component nesting in the rider markers.
Keep the visual surface of the rider markers calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary rider markers information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the rider markers.
Use the reference HMI's instrument-panel logic as inspiration for the rider markers.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the rider markers feel native to Rideclub's spatial operating-system concept.
The final rider markers must not look like a generic admin dashboard.
The final rider markers must not look like a generic fintech dashboard.
The final rider markers must not look like a generic social feed.
The final rider markers must not look like a generic navigation clone.
The final rider markers must feel like one cohesive Rideclub cockpit.
# 42 — USER LOCATION
Define the location as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the location benefits from geographic awareness.
Use a restrained near-black foundation behind the location.
Use #F4F7FA for primary readable values in the location.
Use #AAB1BD for supporting labels in the location.
Use #66707D for low-priority metadata in the location.
Use #FF4D21 only for Rideclub-primary actions in the location.
Use cyan for live communication state when applicable to the location.
Use green for successful or healthy state when applicable to the location.
Use amber for caution state when applicable to the location.
Use red only for critical state when applicable to the location.
Use technical typography for telemetry values associated with the location.
Use human-readable typography for rider-facing copy associated with the location.
Avoid unnecessary rounded rectangles in the location.
Avoid placing every datum inside its own container in the location.
Use one-pixel structural rules when the location needs visual grouping.
Use negative space as the first grouping mechanism in the location.
Use radial geometry when the location represents a measurable quantity.
Use nodes when the location represents people or geographic entities.
Use lines when the location represents a relationship or sequence.
Use rings when the location represents progress, cohesion, or capacity.
Use large numerals when the location contains a primary metric.
Use compact labels when the location contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive location controls.
Provide a larger sixty-four-pixel interaction zone for the most important location action during riding.
Do not require precise tapping for critical location actions.
Use hold-to-confirm for irreversible or safety-sensitive location actions where appropriate.
Provide immediate visual feedback for every interactive location action.
Animate the location only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the location.
Use sixty-to-two-hundred-fifty millisecond transitions for normal location UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the location.
Use opacity changes to establish secondary hierarchy in the location.
Use scale changes sparingly in the location.
Avoid large bounce animations in the location.
Use subtle glow to indicate active state in the location.
Never use glow as the only indicator of an important location state.
Pair important location states with text, iconography, or geometry.
Preserve the visual hierarchy of the location under reduced-motion settings.
Ensure the location remains understandable without animation.
Ensure the location remains usable at high text zoom.
Ensure the location remains usable in strong outdoor light where possible.
Use high contrast between the location primary value and its background.
Do not use tiny gray text for essential location information.
Keep secondary location information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the location.
Use uppercase tracking only for short telemetry labels in the location.
Use tabular numerals for changing location values.
Keep decimal precision consistent across the location.
Use locale-aware formatting for distance and speed in the location.
Use metric units by default for the location when the user is in a metric locale.
Allow unit preferences to be changed in settings for the location.
Use safe-area insets around the location on mobile devices.
Keep important location content away from gesture navigation edges.
Support landscape orientation for riding-focused location screens.
Support portrait orientation for planning-focused location screens.
Allow the location to reorganize rather than simply shrink at smaller widths.
Do not stack every location element vertically on mobile.
Use edge rails for compact location telemetry on narrow screens.
Use bottom sheets only when the location needs temporary detailed interaction.
Avoid permanent bottom sheets for the location unless the screen is specifically designed around one.
Keep map gestures available whenever the location does not require modal focus.
Prevent accidental map gestures while interacting with critical location controls.
Use pointer-events layering intentionally for the location.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the location.
Use MapLibre layers for geographic information whenever possible for the location.
Use DOM overlays only for interaction-heavy location controls.
Keep route geometry visually dominant over secondary map labels in the location.
Dim irrelevant map detail behind active location guidance.
Use a clear active route line for the location.
Use a thinner inactive route line for alternate location paths.
Use checkpoint nodes to divide long location journeys into understandable segments.
Use start and destination markers consistently in the location.
Use directional orientation for moving rider markers in the location.
Avoid using generic pins for every location object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the location.
Use clustering when many location entities overlap.
Use expansion behavior when a location cluster is selected.
Use proximity to determine emphasis for nearby location entities.
Use distance labels only when distance is actionable for the location.
Use live state indicators for connected location entities.
Use stale-state indicators when location data has not updated recently.
Never imply live location data when the network is offline.
Clearly communicate offline state within the location.
Use cached data gracefully for the location.
Design the location to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the location.
Show network state without turning the location into a diagnostic screen.
Keep system diagnostics secondary to the location user goal.
Use haptic-ready interaction semantics for the location where supported.
Use sound-ready states for the location where auditory feedback is useful.
Do not make sound the only indication of a critical location state.
Use clear visual acknowledgment after the location receives an action.
Use optimistic feedback only when the location action can safely be reversed.
Use progress indicators for long-running location operations.
Use skeletons only when they help preserve the location layout.
Avoid generic spinner-only loading states for major location screens.
Provide purposeful empty states for the location.
Provide recovery actions for location errors.
Keep error messages concise and actionable in the location.
Use a technical but human tone for location system messages.
Never use jargon that the rider cannot understand in the location.
Keep safety-critical copy direct and unambiguous in the location.
Validate the location at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the location at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the location in both portrait and landscape layouts.
Validate the location with long rider names.
Validate the location with long route names.
Validate the location with zero riders.
Validate the location with one rider.
Validate the location with a full group.
Validate the location with slow network conditions.
Validate the location with no network.
Validate the location with poor GPS accuracy.
Validate the location with rapidly changing telemetry.
Validate the location with accessibility text scaling.
Validate the location with reduced motion.
Validate the location with keyboard navigation where applicable.
Validate the location with screen readers for non-driving planning contexts.
Validate the location with touch and pointer input.
Validate the location with glove-friendly target sizing.
Document every interactive state of the location.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the location.
Create a reusable component contract for the location.
Keep component APIs semantic rather than visual-only for the location.
Separate data state from presentation state in the location.
Keep animation state separate from business state in the location.
Avoid hardcoding user-specific values into the location.
Drive location values from the application's data layer.
Keep the location resilient to missing optional data.
Keep the location deterministic during replay or ride-history inspection.
Use consistent time formatting across the location.
Use consistent distance formatting across the location.
Use consistent rider status terminology across the location.
Use consistent alert severity terminology across the location.
Use consistent route terminology across the location.
Use consistent checkpoint terminology across the location.
Use consistent connection terminology across the location.
Do not introduce a new visual pattern for the location if an existing pattern already solves the same problem.
Prefer composition over component nesting in the location.
Keep the visual surface of the location calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary location information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the location.
Use the reference HMI's instrument-panel logic as inspiration for the location.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the location feel native to Rideclub's spatial operating-system concept.
The final location must not look like a generic admin dashboard.
The final location must not look like a generic fintech dashboard.
The final location must not look like a generic social feed.
The final location must not look like a generic navigation clone.
The final location must feel like one cohesive Rideclub cockpit.
# 43 — WEATHER SURFACE
Define the weather as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the weather benefits from geographic awareness.
Use a restrained near-black foundation behind the weather.
Use #F4F7FA for primary readable values in the weather.
Use #AAB1BD for supporting labels in the weather.
Use #66707D for low-priority metadata in the weather.
Use #FF4D21 only for Rideclub-primary actions in the weather.
Use cyan for live communication state when applicable to the weather.
Use green for successful or healthy state when applicable to the weather.
Use amber for caution state when applicable to the weather.
Use red only for critical state when applicable to the weather.
Use technical typography for telemetry values associated with the weather.
Use human-readable typography for rider-facing copy associated with the weather.
Avoid unnecessary rounded rectangles in the weather.
Avoid placing every datum inside its own container in the weather.
Use one-pixel structural rules when the weather needs visual grouping.
Use negative space as the first grouping mechanism in the weather.
Use radial geometry when the weather represents a measurable quantity.
Use nodes when the weather represents people or geographic entities.
Use lines when the weather represents a relationship or sequence.
Use rings when the weather represents progress, cohesion, or capacity.
Use large numerals when the weather contains a primary metric.
Use compact labels when the weather contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive weather controls.
Provide a larger sixty-four-pixel interaction zone for the most important weather action during riding.
Do not require precise tapping for critical weather actions.
Use hold-to-confirm for irreversible or safety-sensitive weather actions where appropriate.
Provide immediate visual feedback for every interactive weather action.
Animate the weather only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the weather.
Use sixty-to-two-hundred-fifty millisecond transitions for normal weather UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the weather.
Use opacity changes to establish secondary hierarchy in the weather.
Use scale changes sparingly in the weather.
Avoid large bounce animations in the weather.
Use subtle glow to indicate active state in the weather.
Never use glow as the only indicator of an important weather state.
Pair important weather states with text, iconography, or geometry.
Preserve the visual hierarchy of the weather under reduced-motion settings.
Ensure the weather remains understandable without animation.
Ensure the weather remains usable at high text zoom.
Ensure the weather remains usable in strong outdoor light where possible.
Use high contrast between the weather primary value and its background.
Do not use tiny gray text for essential weather information.
Keep secondary weather information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the weather.
Use uppercase tracking only for short telemetry labels in the weather.
Use tabular numerals for changing weather values.
Keep decimal precision consistent across the weather.
Use locale-aware formatting for distance and speed in the weather.
Use metric units by default for the weather when the user is in a metric locale.
Allow unit preferences to be changed in settings for the weather.
Use safe-area insets around the weather on mobile devices.
Keep important weather content away from gesture navigation edges.
Support landscape orientation for riding-focused weather screens.
Support portrait orientation for planning-focused weather screens.
Allow the weather to reorganize rather than simply shrink at smaller widths.
Do not stack every weather element vertically on mobile.
Use edge rails for compact weather telemetry on narrow screens.
Use bottom sheets only when the weather needs temporary detailed interaction.
Avoid permanent bottom sheets for the weather unless the screen is specifically designed around one.
Keep map gestures available whenever the weather does not require modal focus.
Prevent accidental map gestures while interacting with critical weather controls.
Use pointer-events layering intentionally for the weather.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the weather.
Use MapLibre layers for geographic information whenever possible for the weather.
Use DOM overlays only for interaction-heavy weather controls.
Keep route geometry visually dominant over secondary map labels in the weather.
Dim irrelevant map detail behind active weather guidance.
Use a clear active route line for the weather.
Use a thinner inactive route line for alternate weather paths.
Use checkpoint nodes to divide long weather journeys into understandable segments.
Use start and destination markers consistently in the weather.
Use directional orientation for moving rider markers in the weather.
Avoid using generic pins for every weather object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the weather.
Use clustering when many weather entities overlap.
Use expansion behavior when a weather cluster is selected.
Use proximity to determine emphasis for nearby weather entities.
Use distance labels only when distance is actionable for the weather.
Use live state indicators for connected weather entities.
Use stale-state indicators when weather data has not updated recently.
Never imply live weather data when the network is offline.
Clearly communicate offline state within the weather.
Use cached data gracefully for the weather.
Design the weather to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the weather.
Show network state without turning the weather into a diagnostic screen.
Keep system diagnostics secondary to the weather user goal.
Use haptic-ready interaction semantics for the weather where supported.
Use sound-ready states for the weather where auditory feedback is useful.
Do not make sound the only indication of a critical weather state.
Use clear visual acknowledgment after the weather receives an action.
Use optimistic feedback only when the weather action can safely be reversed.
Use progress indicators for long-running weather operations.
Use skeletons only when they help preserve the weather layout.
Avoid generic spinner-only loading states for major weather screens.
Provide purposeful empty states for the weather.
Provide recovery actions for weather errors.
Keep error messages concise and actionable in the weather.
Use a technical but human tone for weather system messages.
Never use jargon that the rider cannot understand in the weather.
Keep safety-critical copy direct and unambiguous in the weather.
Validate the weather at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the weather at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the weather in both portrait and landscape layouts.
Validate the weather with long rider names.
Validate the weather with long route names.
Validate the weather with zero riders.
Validate the weather with one rider.
Validate the weather with a full group.
Validate the weather with slow network conditions.
Validate the weather with no network.
Validate the weather with poor GPS accuracy.
Validate the weather with rapidly changing telemetry.
Validate the weather with accessibility text scaling.
Validate the weather with reduced motion.
Validate the weather with keyboard navigation where applicable.
Validate the weather with screen readers for non-driving planning contexts.
Validate the weather with touch and pointer input.
Validate the weather with glove-friendly target sizing.
Document every interactive state of the weather.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the weather.
Create a reusable component contract for the weather.
Keep component APIs semantic rather than visual-only for the weather.
Separate data state from presentation state in the weather.
Keep animation state separate from business state in the weather.
Avoid hardcoding user-specific values into the weather.
Drive weather values from the application's data layer.
Keep the weather resilient to missing optional data.
Keep the weather deterministic during replay or ride-history inspection.
Use consistent time formatting across the weather.
Use consistent distance formatting across the weather.
Use consistent rider status terminology across the weather.
Use consistent alert severity terminology across the weather.
Use consistent route terminology across the weather.
Use consistent checkpoint terminology across the weather.
Use consistent connection terminology across the weather.
Do not introduce a new visual pattern for the weather if an existing pattern already solves the same problem.
Prefer composition over component nesting in the weather.
Keep the visual surface of the weather calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary weather information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the weather.
Use the reference HMI's instrument-panel logic as inspiration for the weather.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the weather feel native to Rideclub's spatial operating-system concept.
The final weather must not look like a generic admin dashboard.
The final weather must not look like a generic fintech dashboard.
The final weather must not look like a generic social feed.
The final weather must not look like a generic navigation clone.
The final weather must feel like one cohesive Rideclub cockpit.
# 44 — SYSTEM STATUS
Define the system status as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the system status benefits from geographic awareness.
Use a restrained near-black foundation behind the system status.
Use #F4F7FA for primary readable values in the system status.
Use #AAB1BD for supporting labels in the system status.
Use #66707D for low-priority metadata in the system status.
Use #FF4D21 only for Rideclub-primary actions in the system status.
Use cyan for live communication state when applicable to the system status.
Use green for successful or healthy state when applicable to the system status.
Use amber for caution state when applicable to the system status.
Use red only for critical state when applicable to the system status.
Use technical typography for telemetry values associated with the system status.
Use human-readable typography for rider-facing copy associated with the system status.
Avoid unnecessary rounded rectangles in the system status.
Avoid placing every datum inside its own container in the system status.
Use one-pixel structural rules when the system status needs visual grouping.
Use negative space as the first grouping mechanism in the system status.
Use radial geometry when the system status represents a measurable quantity.
Use nodes when the system status represents people or geographic entities.
Use lines when the system status represents a relationship or sequence.
Use rings when the system status represents progress, cohesion, or capacity.
Use large numerals when the system status contains a primary metric.
Use compact labels when the system status contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive system status controls.
Provide a larger sixty-four-pixel interaction zone for the most important system status action during riding.
Do not require precise tapping for critical system status actions.
Use hold-to-confirm for irreversible or safety-sensitive system status actions where appropriate.
Provide immediate visual feedback for every interactive system status action.
Animate the system status only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the system status.
Use sixty-to-two-hundred-fifty millisecond transitions for normal system status UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the system status.
Use opacity changes to establish secondary hierarchy in the system status.
Use scale changes sparingly in the system status.
Avoid large bounce animations in the system status.
Use subtle glow to indicate active state in the system status.
Never use glow as the only indicator of an important system status state.
Pair important system status states with text, iconography, or geometry.
Preserve the visual hierarchy of the system status under reduced-motion settings.
Ensure the system status remains understandable without animation.
Ensure the system status remains usable at high text zoom.
Ensure the system status remains usable in strong outdoor light where possible.
Use high contrast between the system status primary value and its background.
Do not use tiny gray text for essential system status information.
Keep secondary system status information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the system status.
Use uppercase tracking only for short telemetry labels in the system status.
Use tabular numerals for changing system status values.
Keep decimal precision consistent across the system status.
Use locale-aware formatting for distance and speed in the system status.
Use metric units by default for the system status when the user is in a metric locale.
Allow unit preferences to be changed in settings for the system status.
Use safe-area insets around the system status on mobile devices.
Keep important system status content away from gesture navigation edges.
Support landscape orientation for riding-focused system status screens.
Support portrait orientation for planning-focused system status screens.
Allow the system status to reorganize rather than simply shrink at smaller widths.
Do not stack every system status element vertically on mobile.
Use edge rails for compact system status telemetry on narrow screens.
Use bottom sheets only when the system status needs temporary detailed interaction.
Avoid permanent bottom sheets for the system status unless the screen is specifically designed around one.
Keep map gestures available whenever the system status does not require modal focus.
Prevent accidental map gestures while interacting with critical system status controls.
Use pointer-events layering intentionally for the system status.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the system status.
Use MapLibre layers for geographic information whenever possible for the system status.
Use DOM overlays only for interaction-heavy system status controls.
Keep route geometry visually dominant over secondary map labels in the system status.
Dim irrelevant map detail behind active system status guidance.
Use a clear active route line for the system status.
Use a thinner inactive route line for alternate system status paths.
Use checkpoint nodes to divide long system status journeys into understandable segments.
Use start and destination markers consistently in the system status.
Use directional orientation for moving rider markers in the system status.
Avoid using generic pins for every system status object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the system status.
Use clustering when many system status entities overlap.
Use expansion behavior when a system status cluster is selected.
Use proximity to determine emphasis for nearby system status entities.
Use distance labels only when distance is actionable for the system status.
Use live state indicators for connected system status entities.
Use stale-state indicators when system status data has not updated recently.
Never imply live system status data when the network is offline.
Clearly communicate offline state within the system status.
Use cached data gracefully for the system status.
Design the system status to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the system status.
Show network state without turning the system status into a diagnostic screen.
Keep system diagnostics secondary to the system status user goal.
Use haptic-ready interaction semantics for the system status where supported.
Use sound-ready states for the system status where auditory feedback is useful.
Do not make sound the only indication of a critical system status state.
Use clear visual acknowledgment after the system status receives an action.
Use optimistic feedback only when the system status action can safely be reversed.
Use progress indicators for long-running system status operations.
Use skeletons only when they help preserve the system status layout.
Avoid generic spinner-only loading states for major system status screens.
Provide purposeful empty states for the system status.
Provide recovery actions for system status errors.
Keep error messages concise and actionable in the system status.
Use a technical but human tone for system status system messages.
Never use jargon that the rider cannot understand in the system status.
Keep safety-critical copy direct and unambiguous in the system status.
Validate the system status at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the system status at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the system status in both portrait and landscape layouts.
Validate the system status with long rider names.
Validate the system status with long route names.
Validate the system status with zero riders.
Validate the system status with one rider.
Validate the system status with a full group.
Validate the system status with slow network conditions.
Validate the system status with no network.
Validate the system status with poor GPS accuracy.
Validate the system status with rapidly changing telemetry.
Validate the system status with accessibility text scaling.
Validate the system status with reduced motion.
Validate the system status with keyboard navigation where applicable.
Validate the system status with screen readers for non-driving planning contexts.
Validate the system status with touch and pointer input.
Validate the system status with glove-friendly target sizing.
Document every interactive state of the system status.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the system status.
Create a reusable component contract for the system status.
Keep component APIs semantic rather than visual-only for the system status.
Separate data state from presentation state in the system status.
Keep animation state separate from business state in the system status.
Avoid hardcoding user-specific values into the system status.
Drive system status values from the application's data layer.
Keep the system status resilient to missing optional data.
Keep the system status deterministic during replay or ride-history inspection.
Use consistent time formatting across the system status.
Use consistent distance formatting across the system status.
Use consistent rider status terminology across the system status.
Use consistent alert severity terminology across the system status.
Use consistent route terminology across the system status.
Use consistent checkpoint terminology across the system status.
Use consistent connection terminology across the system status.
Do not introduce a new visual pattern for the system status if an existing pattern already solves the same problem.
Prefer composition over component nesting in the system status.
Keep the visual surface of the system status calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary system status information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the system status.
Use the reference HMI's instrument-panel logic as inspiration for the system status.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the system status feel native to Rideclub's spatial operating-system concept.
The final system status must not look like a generic admin dashboard.
The final system status must not look like a generic fintech dashboard.
The final system status must not look like a generic social feed.
The final system status must not look like a generic navigation clone.
The final system status must feel like one cohesive Rideclub cockpit.
# 45 — GPS STATUS
Define the GPS as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the GPS benefits from geographic awareness.
Use a restrained near-black foundation behind the GPS.
Use #F4F7FA for primary readable values in the GPS.
Use #AAB1BD for supporting labels in the GPS.
Use #66707D for low-priority metadata in the GPS.
Use #FF4D21 only for Rideclub-primary actions in the GPS.
Use cyan for live communication state when applicable to the GPS.
Use green for successful or healthy state when applicable to the GPS.
Use amber for caution state when applicable to the GPS.
Use red only for critical state when applicable to the GPS.
Use technical typography for telemetry values associated with the GPS.
Use human-readable typography for rider-facing copy associated with the GPS.
Avoid unnecessary rounded rectangles in the GPS.
Avoid placing every datum inside its own container in the GPS.
Use one-pixel structural rules when the GPS needs visual grouping.
Use negative space as the first grouping mechanism in the GPS.
Use radial geometry when the GPS represents a measurable quantity.
Use nodes when the GPS represents people or geographic entities.
Use lines when the GPS represents a relationship or sequence.
Use rings when the GPS represents progress, cohesion, or capacity.
Use large numerals when the GPS contains a primary metric.
Use compact labels when the GPS contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive GPS controls.
Provide a larger sixty-four-pixel interaction zone for the most important GPS action during riding.
Do not require precise tapping for critical GPS actions.
Use hold-to-confirm for irreversible or safety-sensitive GPS actions where appropriate.
Provide immediate visual feedback for every interactive GPS action.
Animate the GPS only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the GPS.
Use sixty-to-two-hundred-fifty millisecond transitions for normal GPS UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the GPS.
Use opacity changes to establish secondary hierarchy in the GPS.
Use scale changes sparingly in the GPS.
Avoid large bounce animations in the GPS.
Use subtle glow to indicate active state in the GPS.
Never use glow as the only indicator of an important GPS state.
Pair important GPS states with text, iconography, or geometry.
Preserve the visual hierarchy of the GPS under reduced-motion settings.
Ensure the GPS remains understandable without animation.
Ensure the GPS remains usable at high text zoom.
Ensure the GPS remains usable in strong outdoor light where possible.
Use high contrast between the GPS primary value and its background.
Do not use tiny gray text for essential GPS information.
Keep secondary GPS information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the GPS.
Use uppercase tracking only for short telemetry labels in the GPS.
Use tabular numerals for changing GPS values.
Keep decimal precision consistent across the GPS.
Use locale-aware formatting for distance and speed in the GPS.
Use metric units by default for the GPS when the user is in a metric locale.
Allow unit preferences to be changed in settings for the GPS.
Use safe-area insets around the GPS on mobile devices.
Keep important GPS content away from gesture navigation edges.
Support landscape orientation for riding-focused GPS screens.
Support portrait orientation for planning-focused GPS screens.
Allow the GPS to reorganize rather than simply shrink at smaller widths.
Do not stack every GPS element vertically on mobile.
Use edge rails for compact GPS telemetry on narrow screens.
Use bottom sheets only when the GPS needs temporary detailed interaction.
Avoid permanent bottom sheets for the GPS unless the screen is specifically designed around one.
Keep map gestures available whenever the GPS does not require modal focus.
Prevent accidental map gestures while interacting with critical GPS controls.
Use pointer-events layering intentionally for the GPS.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the GPS.
Use MapLibre layers for geographic information whenever possible for the GPS.
Use DOM overlays only for interaction-heavy GPS controls.
Keep route geometry visually dominant over secondary map labels in the GPS.
Dim irrelevant map detail behind active GPS guidance.
Use a clear active route line for the GPS.
Use a thinner inactive route line for alternate GPS paths.
Use checkpoint nodes to divide long GPS journeys into understandable segments.
Use start and destination markers consistently in the GPS.
Use directional orientation for moving rider markers in the GPS.
Avoid using generic pins for every GPS object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the GPS.
Use clustering when many GPS entities overlap.
Use expansion behavior when a GPS cluster is selected.
Use proximity to determine emphasis for nearby GPS entities.
Use distance labels only when distance is actionable for the GPS.
Use live state indicators for connected GPS entities.
Use stale-state indicators when GPS data has not updated recently.
Never imply live GPS data when the network is offline.
Clearly communicate offline state within the GPS.
Use cached data gracefully for the GPS.
Design the GPS to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the GPS.
Show network state without turning the GPS into a diagnostic screen.
Keep system diagnostics secondary to the GPS user goal.
Use haptic-ready interaction semantics for the GPS where supported.
Use sound-ready states for the GPS where auditory feedback is useful.
Do not make sound the only indication of a critical GPS state.
Use clear visual acknowledgment after the GPS receives an action.
Use optimistic feedback only when the GPS action can safely be reversed.
Use progress indicators for long-running GPS operations.
Use skeletons only when they help preserve the GPS layout.
Avoid generic spinner-only loading states for major GPS screens.
Provide purposeful empty states for the GPS.
Provide recovery actions for GPS errors.
Keep error messages concise and actionable in the GPS.
Use a technical but human tone for GPS system messages.
Never use jargon that the rider cannot understand in the GPS.
Keep safety-critical copy direct and unambiguous in the GPS.
Validate the GPS at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the GPS at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the GPS in both portrait and landscape layouts.
Validate the GPS with long rider names.
Validate the GPS with long route names.
Validate the GPS with zero riders.
Validate the GPS with one rider.
Validate the GPS with a full group.
Validate the GPS with slow network conditions.
Validate the GPS with no network.
Validate the GPS with poor GPS accuracy.
Validate the GPS with rapidly changing telemetry.
Validate the GPS with accessibility text scaling.
Validate the GPS with reduced motion.
Validate the GPS with keyboard navigation where applicable.
Validate the GPS with screen readers for non-driving planning contexts.
Validate the GPS with touch and pointer input.
Validate the GPS with glove-friendly target sizing.
Document every interactive state of the GPS.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the GPS.
Create a reusable component contract for the GPS.
Keep component APIs semantic rather than visual-only for the GPS.
Separate data state from presentation state in the GPS.
Keep animation state separate from business state in the GPS.
Avoid hardcoding user-specific values into the GPS.
Drive GPS values from the application's data layer.
Keep the GPS resilient to missing optional data.
Keep the GPS deterministic during replay or ride-history inspection.
Use consistent time formatting across the GPS.
Use consistent distance formatting across the GPS.
Use consistent rider status terminology across the GPS.
Use consistent alert severity terminology across the GPS.
Use consistent route terminology across the GPS.
Use consistent checkpoint terminology across the GPS.
Use consistent connection terminology across the GPS.
Do not introduce a new visual pattern for the GPS if an existing pattern already solves the same problem.
Prefer composition over component nesting in the GPS.
Keep the visual surface of the GPS calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary GPS information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the GPS.
Use the reference HMI's instrument-panel logic as inspiration for the GPS.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the GPS feel native to Rideclub's spatial operating-system concept.
The final GPS must not look like a generic admin dashboard.
The final GPS must not look like a generic fintech dashboard.
The final GPS must not look like a generic social feed.
The final GPS must not look like a generic navigation clone.
The final GPS must feel like one cohesive Rideclub cockpit.
# 46 — BATTERY STATUS
Define the battery as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the battery benefits from geographic awareness.
Use a restrained near-black foundation behind the battery.
Use #F4F7FA for primary readable values in the battery.
Use #AAB1BD for supporting labels in the battery.
Use #66707D for low-priority metadata in the battery.
Use #FF4D21 only for Rideclub-primary actions in the battery.
Use cyan for live communication state when applicable to the battery.
Use green for successful or healthy state when applicable to the battery.
Use amber for caution state when applicable to the battery.
Use red only for critical state when applicable to the battery.
Use technical typography for telemetry values associated with the battery.
Use human-readable typography for rider-facing copy associated with the battery.
Avoid unnecessary rounded rectangles in the battery.
Avoid placing every datum inside its own container in the battery.
Use one-pixel structural rules when the battery needs visual grouping.
Use negative space as the first grouping mechanism in the battery.
Use radial geometry when the battery represents a measurable quantity.
Use nodes when the battery represents people or geographic entities.
Use lines when the battery represents a relationship or sequence.
Use rings when the battery represents progress, cohesion, or capacity.
Use large numerals when the battery contains a primary metric.
Use compact labels when the battery contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive battery controls.
Provide a larger sixty-four-pixel interaction zone for the most important battery action during riding.
Do not require precise tapping for critical battery actions.
Use hold-to-confirm for irreversible or safety-sensitive battery actions where appropriate.
Provide immediate visual feedback for every interactive battery action.
Animate the battery only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the battery.
Use sixty-to-two-hundred-fifty millisecond transitions for normal battery UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the battery.
Use opacity changes to establish secondary hierarchy in the battery.
Use scale changes sparingly in the battery.
Avoid large bounce animations in the battery.
Use subtle glow to indicate active state in the battery.
Never use glow as the only indicator of an important battery state.
Pair important battery states with text, iconography, or geometry.
Preserve the visual hierarchy of the battery under reduced-motion settings.
Ensure the battery remains understandable without animation.
Ensure the battery remains usable at high text zoom.
Ensure the battery remains usable in strong outdoor light where possible.
Use high contrast between the battery primary value and its background.
Do not use tiny gray text for essential battery information.
Keep secondary battery information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the battery.
Use uppercase tracking only for short telemetry labels in the battery.
Use tabular numerals for changing battery values.
Keep decimal precision consistent across the battery.
Use locale-aware formatting for distance and speed in the battery.
Use metric units by default for the battery when the user is in a metric locale.
Allow unit preferences to be changed in settings for the battery.
Use safe-area insets around the battery on mobile devices.
Keep important battery content away from gesture navigation edges.
Support landscape orientation for riding-focused battery screens.
Support portrait orientation for planning-focused battery screens.
Allow the battery to reorganize rather than simply shrink at smaller widths.
Do not stack every battery element vertically on mobile.
Use edge rails for compact battery telemetry on narrow screens.
Use bottom sheets only when the battery needs temporary detailed interaction.
Avoid permanent bottom sheets for the battery unless the screen is specifically designed around one.
Keep map gestures available whenever the battery does not require modal focus.
Prevent accidental map gestures while interacting with critical battery controls.
Use pointer-events layering intentionally for the battery.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the battery.
Use MapLibre layers for geographic information whenever possible for the battery.
Use DOM overlays only for interaction-heavy battery controls.
Keep route geometry visually dominant over secondary map labels in the battery.
Dim irrelevant map detail behind active battery guidance.
Use a clear active route line for the battery.
Use a thinner inactive route line for alternate battery paths.
Use checkpoint nodes to divide long battery journeys into understandable segments.
Use start and destination markers consistently in the battery.
Use directional orientation for moving rider markers in the battery.
Avoid using generic pins for every battery object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the battery.
Use clustering when many battery entities overlap.
Use expansion behavior when a battery cluster is selected.
Use proximity to determine emphasis for nearby battery entities.
Use distance labels only when distance is actionable for the battery.
Use live state indicators for connected battery entities.
Use stale-state indicators when battery data has not updated recently.
Never imply live battery data when the network is offline.
Clearly communicate offline state within the battery.
Use cached data gracefully for the battery.
Design the battery to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the battery.
Show network state without turning the battery into a diagnostic screen.
Keep system diagnostics secondary to the battery user goal.
Use haptic-ready interaction semantics for the battery where supported.
Use sound-ready states for the battery where auditory feedback is useful.
Do not make sound the only indication of a critical battery state.
Use clear visual acknowledgment after the battery receives an action.
Use optimistic feedback only when the battery action can safely be reversed.
Use progress indicators for long-running battery operations.
Use skeletons only when they help preserve the battery layout.
Avoid generic spinner-only loading states for major battery screens.
Provide purposeful empty states for the battery.
Provide recovery actions for battery errors.
Keep error messages concise and actionable in the battery.
Use a technical but human tone for battery system messages.
Never use jargon that the rider cannot understand in the battery.
Keep safety-critical copy direct and unambiguous in the battery.
Validate the battery at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the battery at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the battery in both portrait and landscape layouts.
Validate the battery with long rider names.
Validate the battery with long route names.
Validate the battery with zero riders.
Validate the battery with one rider.
Validate the battery with a full group.
Validate the battery with slow network conditions.
Validate the battery with no network.
Validate the battery with poor GPS accuracy.
Validate the battery with rapidly changing telemetry.
Validate the battery with accessibility text scaling.
Validate the battery with reduced motion.
Validate the battery with keyboard navigation where applicable.
Validate the battery with screen readers for non-driving planning contexts.
Validate the battery with touch and pointer input.
Validate the battery with glove-friendly target sizing.
Document every interactive state of the battery.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the battery.
Create a reusable component contract for the battery.
Keep component APIs semantic rather than visual-only for the battery.
Separate data state from presentation state in the battery.
Keep animation state separate from business state in the battery.
Avoid hardcoding user-specific values into the battery.
Drive battery values from the application's data layer.
Keep the battery resilient to missing optional data.
Keep the battery deterministic during replay or ride-history inspection.
Use consistent time formatting across the battery.
Use consistent distance formatting across the battery.
Use consistent rider status terminology across the battery.
Use consistent alert severity terminology across the battery.
Use consistent route terminology across the battery.
Use consistent checkpoint terminology across the battery.
Use consistent connection terminology across the battery.
Do not introduce a new visual pattern for the battery if an existing pattern already solves the same problem.
Prefer composition over component nesting in the battery.
Keep the visual surface of the battery calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary battery information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the battery.
Use the reference HMI's instrument-panel logic as inspiration for the battery.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the battery feel native to Rideclub's spatial operating-system concept.
The final battery must not look like a generic admin dashboard.
The final battery must not look like a generic fintech dashboard.
The final battery must not look like a generic social feed.
The final battery must not look like a generic navigation clone.
The final battery must feel like one cohesive Rideclub cockpit.
# 47 — NETWORK STATUS
Define the network as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the network benefits from geographic awareness.
Use a restrained near-black foundation behind the network.
Use #F4F7FA for primary readable values in the network.
Use #AAB1BD for supporting labels in the network.
Use #66707D for low-priority metadata in the network.
Use #FF4D21 only for Rideclub-primary actions in the network.
Use cyan for live communication state when applicable to the network.
Use green for successful or healthy state when applicable to the network.
Use amber for caution state when applicable to the network.
Use red only for critical state when applicable to the network.
Use technical typography for telemetry values associated with the network.
Use human-readable typography for rider-facing copy associated with the network.
Avoid unnecessary rounded rectangles in the network.
Avoid placing every datum inside its own container in the network.
Use one-pixel structural rules when the network needs visual grouping.
Use negative space as the first grouping mechanism in the network.
Use radial geometry when the network represents a measurable quantity.
Use nodes when the network represents people or geographic entities.
Use lines when the network represents a relationship or sequence.
Use rings when the network represents progress, cohesion, or capacity.
Use large numerals when the network contains a primary metric.
Use compact labels when the network contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive network controls.
Provide a larger sixty-four-pixel interaction zone for the most important network action during riding.
Do not require precise tapping for critical network actions.
Use hold-to-confirm for irreversible or safety-sensitive network actions where appropriate.
Provide immediate visual feedback for every interactive network action.
Animate the network only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the network.
Use sixty-to-two-hundred-fifty millisecond transitions for normal network UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the network.
Use opacity changes to establish secondary hierarchy in the network.
Use scale changes sparingly in the network.
Avoid large bounce animations in the network.
Use subtle glow to indicate active state in the network.
Never use glow as the only indicator of an important network state.
Pair important network states with text, iconography, or geometry.
Preserve the visual hierarchy of the network under reduced-motion settings.
Ensure the network remains understandable without animation.
Ensure the network remains usable at high text zoom.
Ensure the network remains usable in strong outdoor light where possible.
Use high contrast between the network primary value and its background.
Do not use tiny gray text for essential network information.
Keep secondary network information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the network.
Use uppercase tracking only for short telemetry labels in the network.
Use tabular numerals for changing network values.
Keep decimal precision consistent across the network.
Use locale-aware formatting for distance and speed in the network.
Use metric units by default for the network when the user is in a metric locale.
Allow unit preferences to be changed in settings for the network.
Use safe-area insets around the network on mobile devices.
Keep important network content away from gesture navigation edges.
Support landscape orientation for riding-focused network screens.
Support portrait orientation for planning-focused network screens.
Allow the network to reorganize rather than simply shrink at smaller widths.
Do not stack every network element vertically on mobile.
Use edge rails for compact network telemetry on narrow screens.
Use bottom sheets only when the network needs temporary detailed interaction.
Avoid permanent bottom sheets for the network unless the screen is specifically designed around one.
Keep map gestures available whenever the network does not require modal focus.
Prevent accidental map gestures while interacting with critical network controls.
Use pointer-events layering intentionally for the network.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the network.
Use MapLibre layers for geographic information whenever possible for the network.
Use DOM overlays only for interaction-heavy network controls.
Keep route geometry visually dominant over secondary map labels in the network.
Dim irrelevant map detail behind active network guidance.
Use a clear active route line for the network.
Use a thinner inactive route line for alternate network paths.
Use checkpoint nodes to divide long network journeys into understandable segments.
Use start and destination markers consistently in the network.
Use directional orientation for moving rider markers in the network.
Avoid using generic pins for every network object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the network.
Use clustering when many network entities overlap.
Use expansion behavior when a network cluster is selected.
Use proximity to determine emphasis for nearby network entities.
Use distance labels only when distance is actionable for the network.
Use live state indicators for connected network entities.
Use stale-state indicators when network data has not updated recently.
Never imply live network data when the network is offline.
Clearly communicate offline state within the network.
Use cached data gracefully for the network.
Design the network to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the network.
Show network state without turning the network into a diagnostic screen.
Keep system diagnostics secondary to the network user goal.
Use haptic-ready interaction semantics for the network where supported.
Use sound-ready states for the network where auditory feedback is useful.
Do not make sound the only indication of a critical network state.
Use clear visual acknowledgment after the network receives an action.
Use optimistic feedback only when the network action can safely be reversed.
Use progress indicators for long-running network operations.
Use skeletons only when they help preserve the network layout.
Avoid generic spinner-only loading states for major network screens.
Provide purposeful empty states for the network.
Provide recovery actions for network errors.
Keep error messages concise and actionable in the network.
Use a technical but human tone for network system messages.
Never use jargon that the rider cannot understand in the network.
Keep safety-critical copy direct and unambiguous in the network.
Validate the network at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the network at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the network in both portrait and landscape layouts.
Validate the network with long rider names.
Validate the network with long route names.
Validate the network with zero riders.
Validate the network with one rider.
Validate the network with a full group.
Validate the network with slow network conditions.
Validate the network with no network.
Validate the network with poor GPS accuracy.
Validate the network with rapidly changing telemetry.
Validate the network with accessibility text scaling.
Validate the network with reduced motion.
Validate the network with keyboard navigation where applicable.
Validate the network with screen readers for non-driving planning contexts.
Validate the network with touch and pointer input.
Validate the network with glove-friendly target sizing.
Document every interactive state of the network.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the network.
Create a reusable component contract for the network.
Keep component APIs semantic rather than visual-only for the network.
Separate data state from presentation state in the network.
Keep animation state separate from business state in the network.
Avoid hardcoding user-specific values into the network.
Drive network values from the application's data layer.
Keep the network resilient to missing optional data.
Keep the network deterministic during replay or ride-history inspection.
Use consistent time formatting across the network.
Use consistent distance formatting across the network.
Use consistent rider status terminology across the network.
Use consistent alert severity terminology across the network.
Use consistent route terminology across the network.
Use consistent checkpoint terminology across the network.
Use consistent connection terminology across the network.
Do not introduce a new visual pattern for the network if an existing pattern already solves the same problem.
Prefer composition over component nesting in the network.
Keep the visual surface of the network calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary network information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the network.
Use the reference HMI's instrument-panel logic as inspiration for the network.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the network feel native to Rideclub's spatial operating-system concept.
The final network must not look like a generic admin dashboard.
The final network must not look like a generic fintech dashboard.
The final network must not look like a generic social feed.
The final network must not look like a generic navigation clone.
The final network must feel like one cohesive Rideclub cockpit.
# 48 — NOTIFICATIONS
Define the notifications as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the notifications benefits from geographic awareness.
Use a restrained near-black foundation behind the notifications.
Use #F4F7FA for primary readable values in the notifications.
Use #AAB1BD for supporting labels in the notifications.
Use #66707D for low-priority metadata in the notifications.
Use #FF4D21 only for Rideclub-primary actions in the notifications.
Use cyan for live communication state when applicable to the notifications.
Use green for successful or healthy state when applicable to the notifications.
Use amber for caution state when applicable to the notifications.
Use red only for critical state when applicable to the notifications.
Use technical typography for telemetry values associated with the notifications.
Use human-readable typography for rider-facing copy associated with the notifications.
Avoid unnecessary rounded rectangles in the notifications.
Avoid placing every datum inside its own container in the notifications.
Use one-pixel structural rules when the notifications needs visual grouping.
Use negative space as the first grouping mechanism in the notifications.
Use radial geometry when the notifications represents a measurable quantity.
Use nodes when the notifications represents people or geographic entities.
Use lines when the notifications represents a relationship or sequence.
Use rings when the notifications represents progress, cohesion, or capacity.
Use large numerals when the notifications contains a primary metric.
Use compact labels when the notifications contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive notifications controls.
Provide a larger sixty-four-pixel interaction zone for the most important notifications action during riding.
Do not require precise tapping for critical notifications actions.
Use hold-to-confirm for irreversible or safety-sensitive notifications actions where appropriate.
Provide immediate visual feedback for every interactive notifications action.
Animate the notifications only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the notifications.
Use sixty-to-two-hundred-fifty millisecond transitions for normal notifications UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the notifications.
Use opacity changes to establish secondary hierarchy in the notifications.
Use scale changes sparingly in the notifications.
Avoid large bounce animations in the notifications.
Use subtle glow to indicate active state in the notifications.
Never use glow as the only indicator of an important notifications state.
Pair important notifications states with text, iconography, or geometry.
Preserve the visual hierarchy of the notifications under reduced-motion settings.
Ensure the notifications remains understandable without animation.
Ensure the notifications remains usable at high text zoom.
Ensure the notifications remains usable in strong outdoor light where possible.
Use high contrast between the notifications primary value and its background.
Do not use tiny gray text for essential notifications information.
Keep secondary notifications information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the notifications.
Use uppercase tracking only for short telemetry labels in the notifications.
Use tabular numerals for changing notifications values.
Keep decimal precision consistent across the notifications.
Use locale-aware formatting for distance and speed in the notifications.
Use metric units by default for the notifications when the user is in a metric locale.
Allow unit preferences to be changed in settings for the notifications.
Use safe-area insets around the notifications on mobile devices.
Keep important notifications content away from gesture navigation edges.
Support landscape orientation for riding-focused notifications screens.
Support portrait orientation for planning-focused notifications screens.
Allow the notifications to reorganize rather than simply shrink at smaller widths.
Do not stack every notifications element vertically on mobile.
Use edge rails for compact notifications telemetry on narrow screens.
Use bottom sheets only when the notifications needs temporary detailed interaction.
Avoid permanent bottom sheets for the notifications unless the screen is specifically designed around one.
Keep map gestures available whenever the notifications does not require modal focus.
Prevent accidental map gestures while interacting with critical notifications controls.
Use pointer-events layering intentionally for the notifications.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the notifications.
Use MapLibre layers for geographic information whenever possible for the notifications.
Use DOM overlays only for interaction-heavy notifications controls.
Keep route geometry visually dominant over secondary map labels in the notifications.
Dim irrelevant map detail behind active notifications guidance.
Use a clear active route line for the notifications.
Use a thinner inactive route line for alternate notifications paths.
Use checkpoint nodes to divide long notifications journeys into understandable segments.
Use start and destination markers consistently in the notifications.
Use directional orientation for moving rider markers in the notifications.
Avoid using generic pins for every notifications object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the notifications.
Use clustering when many notifications entities overlap.
Use expansion behavior when a notifications cluster is selected.
Use proximity to determine emphasis for nearby notifications entities.
Use distance labels only when distance is actionable for the notifications.
Use live state indicators for connected notifications entities.
Use stale-state indicators when notifications data has not updated recently.
Never imply live notifications data when the network is offline.
Clearly communicate offline state within the notifications.
Use cached data gracefully for the notifications.
Design the notifications to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the notifications.
Show network state without turning the notifications into a diagnostic screen.
Keep system diagnostics secondary to the notifications user goal.
Use haptic-ready interaction semantics for the notifications where supported.
Use sound-ready states for the notifications where auditory feedback is useful.
Do not make sound the only indication of a critical notifications state.
Use clear visual acknowledgment after the notifications receives an action.
Use optimistic feedback only when the notifications action can safely be reversed.
Use progress indicators for long-running notifications operations.
Use skeletons only when they help preserve the notifications layout.
Avoid generic spinner-only loading states for major notifications screens.
Provide purposeful empty states for the notifications.
Provide recovery actions for notifications errors.
Keep error messages concise and actionable in the notifications.
Use a technical but human tone for notifications system messages.
Never use jargon that the rider cannot understand in the notifications.
Keep safety-critical copy direct and unambiguous in the notifications.
Validate the notifications at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the notifications at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the notifications in both portrait and landscape layouts.
Validate the notifications with long rider names.
Validate the notifications with long route names.
Validate the notifications with zero riders.
Validate the notifications with one rider.
Validate the notifications with a full group.
Validate the notifications with slow network conditions.
Validate the notifications with no network.
Validate the notifications with poor GPS accuracy.
Validate the notifications with rapidly changing telemetry.
Validate the notifications with accessibility text scaling.
Validate the notifications with reduced motion.
Validate the notifications with keyboard navigation where applicable.
Validate the notifications with screen readers for non-driving planning contexts.
Validate the notifications with touch and pointer input.
Validate the notifications with glove-friendly target sizing.
Document every interactive state of the notifications.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the notifications.
Create a reusable component contract for the notifications.
Keep component APIs semantic rather than visual-only for the notifications.
Separate data state from presentation state in the notifications.
Keep animation state separate from business state in the notifications.
Avoid hardcoding user-specific values into the notifications.
Drive notifications values from the application's data layer.
Keep the notifications resilient to missing optional data.
Keep the notifications deterministic during replay or ride-history inspection.
Use consistent time formatting across the notifications.
Use consistent distance formatting across the notifications.
Use consistent rider status terminology across the notifications.
Use consistent alert severity terminology across the notifications.
Use consistent route terminology across the notifications.
Use consistent checkpoint terminology across the notifications.
Use consistent connection terminology across the notifications.
Do not introduce a new visual pattern for the notifications if an existing pattern already solves the same problem.
Prefer composition over component nesting in the notifications.
Keep the visual surface of the notifications calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary notifications information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the notifications.
Use the reference HMI's instrument-panel logic as inspiration for the notifications.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the notifications feel native to Rideclub's spatial operating-system concept.
The final notifications must not look like a generic admin dashboard.
The final notifications must not look like a generic fintech dashboard.
The final notifications must not look like a generic social feed.
The final notifications must not look like a generic navigation clone.
The final notifications must feel like one cohesive Rideclub cockpit.
# 49 — TOASTS
Define the toasts as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the toasts benefits from geographic awareness.
Use a restrained near-black foundation behind the toasts.
Use #F4F7FA for primary readable values in the toasts.
Use #AAB1BD for supporting labels in the toasts.
Use #66707D for low-priority metadata in the toasts.
Use #FF4D21 only for Rideclub-primary actions in the toasts.
Use cyan for live communication state when applicable to the toasts.
Use green for successful or healthy state when applicable to the toasts.
Use amber for caution state when applicable to the toasts.
Use red only for critical state when applicable to the toasts.
Use technical typography for telemetry values associated with the toasts.
Use human-readable typography for rider-facing copy associated with the toasts.
Avoid unnecessary rounded rectangles in the toasts.
Avoid placing every datum inside its own container in the toasts.
Use one-pixel structural rules when the toasts needs visual grouping.
Use negative space as the first grouping mechanism in the toasts.
Use radial geometry when the toasts represents a measurable quantity.
Use nodes when the toasts represents people or geographic entities.
Use lines when the toasts represents a relationship or sequence.
Use rings when the toasts represents progress, cohesion, or capacity.
Use large numerals when the toasts contains a primary metric.
Use compact labels when the toasts contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive toasts controls.
Provide a larger sixty-four-pixel interaction zone for the most important toasts action during riding.
Do not require precise tapping for critical toasts actions.
Use hold-to-confirm for irreversible or safety-sensitive toasts actions where appropriate.
Provide immediate visual feedback for every interactive toasts action.
Animate the toasts only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the toasts.
Use sixty-to-two-hundred-fifty millisecond transitions for normal toasts UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the toasts.
Use opacity changes to establish secondary hierarchy in the toasts.
Use scale changes sparingly in the toasts.
Avoid large bounce animations in the toasts.
Use subtle glow to indicate active state in the toasts.
Never use glow as the only indicator of an important toasts state.
Pair important toasts states with text, iconography, or geometry.
Preserve the visual hierarchy of the toasts under reduced-motion settings.
Ensure the toasts remains understandable without animation.
Ensure the toasts remains usable at high text zoom.
Ensure the toasts remains usable in strong outdoor light where possible.
Use high contrast between the toasts primary value and its background.
Do not use tiny gray text for essential toasts information.
Keep secondary toasts information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the toasts.
Use uppercase tracking only for short telemetry labels in the toasts.
Use tabular numerals for changing toasts values.
Keep decimal precision consistent across the toasts.
Use locale-aware formatting for distance and speed in the toasts.
Use metric units by default for the toasts when the user is in a metric locale.
Allow unit preferences to be changed in settings for the toasts.
Use safe-area insets around the toasts on mobile devices.
Keep important toasts content away from gesture navigation edges.
Support landscape orientation for riding-focused toasts screens.
Support portrait orientation for planning-focused toasts screens.
Allow the toasts to reorganize rather than simply shrink at smaller widths.
Do not stack every toasts element vertically on mobile.
Use edge rails for compact toasts telemetry on narrow screens.
Use bottom sheets only when the toasts needs temporary detailed interaction.
Avoid permanent bottom sheets for the toasts unless the screen is specifically designed around one.
Keep map gestures available whenever the toasts does not require modal focus.
Prevent accidental map gestures while interacting with critical toasts controls.
Use pointer-events layering intentionally for the toasts.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the toasts.
Use MapLibre layers for geographic information whenever possible for the toasts.
Use DOM overlays only for interaction-heavy toasts controls.
Keep route geometry visually dominant over secondary map labels in the toasts.
Dim irrelevant map detail behind active toasts guidance.
Use a clear active route line for the toasts.
Use a thinner inactive route line for alternate toasts paths.
Use checkpoint nodes to divide long toasts journeys into understandable segments.
Use start and destination markers consistently in the toasts.
Use directional orientation for moving rider markers in the toasts.
Avoid using generic pins for every toasts object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the toasts.
Use clustering when many toasts entities overlap.
Use expansion behavior when a toasts cluster is selected.
Use proximity to determine emphasis for nearby toasts entities.
Use distance labels only when distance is actionable for the toasts.
Use live state indicators for connected toasts entities.
Use stale-state indicators when toasts data has not updated recently.
Never imply live toasts data when the network is offline.
Clearly communicate offline state within the toasts.
Use cached data gracefully for the toasts.
Design the toasts to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the toasts.
Show network state without turning the toasts into a diagnostic screen.
Keep system diagnostics secondary to the toasts user goal.
Use haptic-ready interaction semantics for the toasts where supported.
Use sound-ready states for the toasts where auditory feedback is useful.
Do not make sound the only indication of a critical toasts state.
Use clear visual acknowledgment after the toasts receives an action.
Use optimistic feedback only when the toasts action can safely be reversed.
Use progress indicators for long-running toasts operations.
Use skeletons only when they help preserve the toasts layout.
Avoid generic spinner-only loading states for major toasts screens.
Provide purposeful empty states for the toasts.
Provide recovery actions for toasts errors.
Keep error messages concise and actionable in the toasts.
Use a technical but human tone for toasts system messages.
Never use jargon that the rider cannot understand in the toasts.
Keep safety-critical copy direct and unambiguous in the toasts.
Validate the toasts at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the toasts at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the toasts in both portrait and landscape layouts.
Validate the toasts with long rider names.
Validate the toasts with long route names.
Validate the toasts with zero riders.
Validate the toasts with one rider.
Validate the toasts with a full group.
Validate the toasts with slow network conditions.
Validate the toasts with no network.
Validate the toasts with poor GPS accuracy.
Validate the toasts with rapidly changing telemetry.
Validate the toasts with accessibility text scaling.
Validate the toasts with reduced motion.
Validate the toasts with keyboard navigation where applicable.
Validate the toasts with screen readers for non-driving planning contexts.
Validate the toasts with touch and pointer input.
Validate the toasts with glove-friendly target sizing.
Document every interactive state of the toasts.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the toasts.
Create a reusable component contract for the toasts.
Keep component APIs semantic rather than visual-only for the toasts.
Separate data state from presentation state in the toasts.
Keep animation state separate from business state in the toasts.
Avoid hardcoding user-specific values into the toasts.
Drive toasts values from the application's data layer.
Keep the toasts resilient to missing optional data.
Keep the toasts deterministic during replay or ride-history inspection.
Use consistent time formatting across the toasts.
Use consistent distance formatting across the toasts.
Use consistent rider status terminology across the toasts.
Use consistent alert severity terminology across the toasts.
Use consistent route terminology across the toasts.
Use consistent checkpoint terminology across the toasts.
Use consistent connection terminology across the toasts.
Do not introduce a new visual pattern for the toasts if an existing pattern already solves the same problem.
Prefer composition over component nesting in the toasts.
Keep the visual surface of the toasts calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary toasts information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the toasts.
Use the reference HMI's instrument-panel logic as inspiration for the toasts.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the toasts feel native to Rideclub's spatial operating-system concept.
The final toasts must not look like a generic admin dashboard.
The final toasts must not look like a generic fintech dashboard.
The final toasts must not look like a generic social feed.
The final toasts must not look like a generic navigation clone.
The final toasts must feel like one cohesive Rideclub cockpit.
# 50 — ALERTS
Define the alerts as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the alerts benefits from geographic awareness.
Use a restrained near-black foundation behind the alerts.
Use #F4F7FA for primary readable values in the alerts.
Use #AAB1BD for supporting labels in the alerts.
Use #66707D for low-priority metadata in the alerts.
Use #FF4D21 only for Rideclub-primary actions in the alerts.
Use cyan for live communication state when applicable to the alerts.
Use green for successful or healthy state when applicable to the alerts.
Use amber for caution state when applicable to the alerts.
Use red only for critical state when applicable to the alerts.
Use technical typography for telemetry values associated with the alerts.
Use human-readable typography for rider-facing copy associated with the alerts.
Avoid unnecessary rounded rectangles in the alerts.
Avoid placing every datum inside its own container in the alerts.
Use one-pixel structural rules when the alerts needs visual grouping.
Use negative space as the first grouping mechanism in the alerts.
Use radial geometry when the alerts represents a measurable quantity.
Use nodes when the alerts represents people or geographic entities.
Use lines when the alerts represents a relationship or sequence.
Use rings when the alerts represents progress, cohesion, or capacity.
Use large numerals when the alerts contains a primary metric.
Use compact labels when the alerts contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive alerts controls.
Provide a larger sixty-four-pixel interaction zone for the most important alerts action during riding.
Do not require precise tapping for critical alerts actions.
Use hold-to-confirm for irreversible or safety-sensitive alerts actions where appropriate.
Provide immediate visual feedback for every interactive alerts action.
Animate the alerts only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the alerts.
Use sixty-to-two-hundred-fifty millisecond transitions for normal alerts UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the alerts.
Use opacity changes to establish secondary hierarchy in the alerts.
Use scale changes sparingly in the alerts.
Avoid large bounce animations in the alerts.
Use subtle glow to indicate active state in the alerts.
Never use glow as the only indicator of an important alerts state.
Pair important alerts states with text, iconography, or geometry.
Preserve the visual hierarchy of the alerts under reduced-motion settings.
Ensure the alerts remains understandable without animation.
Ensure the alerts remains usable at high text zoom.
Ensure the alerts remains usable in strong outdoor light where possible.
Use high contrast between the alerts primary value and its background.
Do not use tiny gray text for essential alerts information.
Keep secondary alerts information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the alerts.
Use uppercase tracking only for short telemetry labels in the alerts.
Use tabular numerals for changing alerts values.
Keep decimal precision consistent across the alerts.
Use locale-aware formatting for distance and speed in the alerts.
Use metric units by default for the alerts when the user is in a metric locale.
Allow unit preferences to be changed in settings for the alerts.
Use safe-area insets around the alerts on mobile devices.
Keep important alerts content away from gesture navigation edges.
Support landscape orientation for riding-focused alerts screens.
Support portrait orientation for planning-focused alerts screens.
Allow the alerts to reorganize rather than simply shrink at smaller widths.
Do not stack every alerts element vertically on mobile.
Use edge rails for compact alerts telemetry on narrow screens.
Use bottom sheets only when the alerts needs temporary detailed interaction.
Avoid permanent bottom sheets for the alerts unless the screen is specifically designed around one.
Keep map gestures available whenever the alerts does not require modal focus.
Prevent accidental map gestures while interacting with critical alerts controls.
Use pointer-events layering intentionally for the alerts.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the alerts.
Use MapLibre layers for geographic information whenever possible for the alerts.
Use DOM overlays only for interaction-heavy alerts controls.
Keep route geometry visually dominant over secondary map labels in the alerts.
Dim irrelevant map detail behind active alerts guidance.
Use a clear active route line for the alerts.
Use a thinner inactive route line for alternate alerts paths.
Use checkpoint nodes to divide long alerts journeys into understandable segments.
Use start and destination markers consistently in the alerts.
Use directional orientation for moving rider markers in the alerts.
Avoid using generic pins for every alerts object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the alerts.
Use clustering when many alerts entities overlap.
Use expansion behavior when a alerts cluster is selected.
Use proximity to determine emphasis for nearby alerts entities.
Use distance labels only when distance is actionable for the alerts.
Use live state indicators for connected alerts entities.
Use stale-state indicators when alerts data has not updated recently.
Never imply live alerts data when the network is offline.
Clearly communicate offline state within the alerts.
Use cached data gracefully for the alerts.
Design the alerts to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the alerts.
Show network state without turning the alerts into a diagnostic screen.
Keep system diagnostics secondary to the alerts user goal.
Use haptic-ready interaction semantics for the alerts where supported.
Use sound-ready states for the alerts where auditory feedback is useful.
Do not make sound the only indication of a critical alerts state.
Use clear visual acknowledgment after the alerts receives an action.
Use optimistic feedback only when the alerts action can safely be reversed.
Use progress indicators for long-running alerts operations.
Use skeletons only when they help preserve the alerts layout.
Avoid generic spinner-only loading states for major alerts screens.
Provide purposeful empty states for the alerts.
Provide recovery actions for alerts errors.
Keep error messages concise and actionable in the alerts.
Use a technical but human tone for alerts system messages.
Never use jargon that the rider cannot understand in the alerts.
Keep safety-critical copy direct and unambiguous in the alerts.
Validate the alerts at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the alerts at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the alerts in both portrait and landscape layouts.
Validate the alerts with long rider names.
Validate the alerts with long route names.
Validate the alerts with zero riders.
Validate the alerts with one rider.
Validate the alerts with a full group.
Validate the alerts with slow network conditions.
Validate the alerts with no network.
Validate the alerts with poor GPS accuracy.
Validate the alerts with rapidly changing telemetry.
Validate the alerts with accessibility text scaling.
Validate the alerts with reduced motion.
Validate the alerts with keyboard navigation where applicable.
Validate the alerts with screen readers for non-driving planning contexts.
Validate the alerts with touch and pointer input.
Validate the alerts with glove-friendly target sizing.
Document every interactive state of the alerts.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the alerts.
Create a reusable component contract for the alerts.
Keep component APIs semantic rather than visual-only for the alerts.
Separate data state from presentation state in the alerts.
Keep animation state separate from business state in the alerts.
Avoid hardcoding user-specific values into the alerts.
Drive alerts values from the application's data layer.
Keep the alerts resilient to missing optional data.
Keep the alerts deterministic during replay or ride-history inspection.
Use consistent time formatting across the alerts.
Use consistent distance formatting across the alerts.
Use consistent rider status terminology across the alerts.
Use consistent alert severity terminology across the alerts.
Use consistent route terminology across the alerts.
Use consistent checkpoint terminology across the alerts.
Use consistent connection terminology across the alerts.
Do not introduce a new visual pattern for the alerts if an existing pattern already solves the same problem.
Prefer composition over component nesting in the alerts.
Keep the visual surface of the alerts calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary alerts information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the alerts.
Use the reference HMI's instrument-panel logic as inspiration for the alerts.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the alerts feel native to Rideclub's spatial operating-system concept.
The final alerts must not look like a generic admin dashboard.
The final alerts must not look like a generic fintech dashboard.
The final alerts must not look like a generic social feed.
The final alerts must not look like a generic navigation clone.
The final alerts must feel like one cohesive Rideclub cockpit.
# 51 — SAFETY UI
Define the safety as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the safety benefits from geographic awareness.
Use a restrained near-black foundation behind the safety.
Use #F4F7FA for primary readable values in the safety.
Use #AAB1BD for supporting labels in the safety.
Use #66707D for low-priority metadata in the safety.
Use #FF4D21 only for Rideclub-primary actions in the safety.
Use cyan for live communication state when applicable to the safety.
Use green for successful or healthy state when applicable to the safety.
Use amber for caution state when applicable to the safety.
Use red only for critical state when applicable to the safety.
Use technical typography for telemetry values associated with the safety.
Use human-readable typography for rider-facing copy associated with the safety.
Avoid unnecessary rounded rectangles in the safety.
Avoid placing every datum inside its own container in the safety.
Use one-pixel structural rules when the safety needs visual grouping.
Use negative space as the first grouping mechanism in the safety.
Use radial geometry when the safety represents a measurable quantity.
Use nodes when the safety represents people or geographic entities.
Use lines when the safety represents a relationship or sequence.
Use rings when the safety represents progress, cohesion, or capacity.
Use large numerals when the safety contains a primary metric.
Use compact labels when the safety contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive safety controls.
Provide a larger sixty-four-pixel interaction zone for the most important safety action during riding.
Do not require precise tapping for critical safety actions.
Use hold-to-confirm for irreversible or safety-sensitive safety actions where appropriate.
Provide immediate visual feedback for every interactive safety action.
Animate the safety only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the safety.
Use sixty-to-two-hundred-fifty millisecond transitions for normal safety UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the safety.
Use opacity changes to establish secondary hierarchy in the safety.
Use scale changes sparingly in the safety.
Avoid large bounce animations in the safety.
Use subtle glow to indicate active state in the safety.
Never use glow as the only indicator of an important safety state.
Pair important safety states with text, iconography, or geometry.
Preserve the visual hierarchy of the safety under reduced-motion settings.
Ensure the safety remains understandable without animation.
Ensure the safety remains usable at high text zoom.
Ensure the safety remains usable in strong outdoor light where possible.
Use high contrast between the safety primary value and its background.
Do not use tiny gray text for essential safety information.
Keep secondary safety information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the safety.
Use uppercase tracking only for short telemetry labels in the safety.
Use tabular numerals for changing safety values.
Keep decimal precision consistent across the safety.
Use locale-aware formatting for distance and speed in the safety.
Use metric units by default for the safety when the user is in a metric locale.
Allow unit preferences to be changed in settings for the safety.
Use safe-area insets around the safety on mobile devices.
Keep important safety content away from gesture navigation edges.
Support landscape orientation for riding-focused safety screens.
Support portrait orientation for planning-focused safety screens.
Allow the safety to reorganize rather than simply shrink at smaller widths.
Do not stack every safety element vertically on mobile.
Use edge rails for compact safety telemetry on narrow screens.
Use bottom sheets only when the safety needs temporary detailed interaction.
Avoid permanent bottom sheets for the safety unless the screen is specifically designed around one.
Keep map gestures available whenever the safety does not require modal focus.
Prevent accidental map gestures while interacting with critical safety controls.
Use pointer-events layering intentionally for the safety.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the safety.
Use MapLibre layers for geographic information whenever possible for the safety.
Use DOM overlays only for interaction-heavy safety controls.
Keep route geometry visually dominant over secondary map labels in the safety.
Dim irrelevant map detail behind active safety guidance.
Use a clear active route line for the safety.
Use a thinner inactive route line for alternate safety paths.
Use checkpoint nodes to divide long safety journeys into understandable segments.
Use start and destination markers consistently in the safety.
Use directional orientation for moving rider markers in the safety.
Avoid using generic pins for every safety object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the safety.
Use clustering when many safety entities overlap.
Use expansion behavior when a safety cluster is selected.
Use proximity to determine emphasis for nearby safety entities.
Use distance labels only when distance is actionable for the safety.
Use live state indicators for connected safety entities.
Use stale-state indicators when safety data has not updated recently.
Never imply live safety data when the network is offline.
Clearly communicate offline state within the safety.
Use cached data gracefully for the safety.
Design the safety to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the safety.
Show network state without turning the safety into a diagnostic screen.
Keep system diagnostics secondary to the safety user goal.
Use haptic-ready interaction semantics for the safety where supported.
Use sound-ready states for the safety where auditory feedback is useful.
Do not make sound the only indication of a critical safety state.
Use clear visual acknowledgment after the safety receives an action.
Use optimistic feedback only when the safety action can safely be reversed.
Use progress indicators for long-running safety operations.
Use skeletons only when they help preserve the safety layout.
Avoid generic spinner-only loading states for major safety screens.
Provide purposeful empty states for the safety.
Provide recovery actions for safety errors.
Keep error messages concise and actionable in the safety.
Use a technical but human tone for safety system messages.
Never use jargon that the rider cannot understand in the safety.
Keep safety-critical copy direct and unambiguous in the safety.
Validate the safety at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the safety at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the safety in both portrait and landscape layouts.
Validate the safety with long rider names.
Validate the safety with long route names.
Validate the safety with zero riders.
Validate the safety with one rider.
Validate the safety with a full group.
Validate the safety with slow network conditions.
Validate the safety with no network.
Validate the safety with poor GPS accuracy.
Validate the safety with rapidly changing telemetry.
Validate the safety with accessibility text scaling.
Validate the safety with reduced motion.
Validate the safety with keyboard navigation where applicable.
Validate the safety with screen readers for non-driving planning contexts.
Validate the safety with touch and pointer input.
Validate the safety with glove-friendly target sizing.
Document every interactive state of the safety.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the safety.
Create a reusable component contract for the safety.
Keep component APIs semantic rather than visual-only for the safety.
Separate data state from presentation state in the safety.
Keep animation state separate from business state in the safety.
Avoid hardcoding user-specific values into the safety.
Drive safety values from the application's data layer.
Keep the safety resilient to missing optional data.
Keep the safety deterministic during replay or ride-history inspection.
Use consistent time formatting across the safety.
Use consistent distance formatting across the safety.
Use consistent rider status terminology across the safety.
Use consistent alert severity terminology across the safety.
Use consistent route terminology across the safety.
Use consistent checkpoint terminology across the safety.
Use consistent connection terminology across the safety.
Do not introduce a new visual pattern for the safety if an existing pattern already solves the same problem.
Prefer composition over component nesting in the safety.
Keep the visual surface of the safety calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary safety information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the safety.
Use the reference HMI's instrument-panel logic as inspiration for the safety.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the safety feel native to Rideclub's spatial operating-system concept.
The final safety must not look like a generic admin dashboard.
The final safety must not look like a generic fintech dashboard.
The final safety must not look like a generic social feed.
The final safety must not look like a generic navigation clone.
The final safety must feel like one cohesive Rideclub cockpit.
# 52 — DYNAMIC SAFETY SCORE
Define the safety score as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the safety score benefits from geographic awareness.
Use a restrained near-black foundation behind the safety score.
Use #F4F7FA for primary readable values in the safety score.
Use #AAB1BD for supporting labels in the safety score.
Use #66707D for low-priority metadata in the safety score.
Use #FF4D21 only for Rideclub-primary actions in the safety score.
Use cyan for live communication state when applicable to the safety score.
Use green for successful or healthy state when applicable to the safety score.
Use amber for caution state when applicable to the safety score.
Use red only for critical state when applicable to the safety score.
Use technical typography for telemetry values associated with the safety score.
Use human-readable typography for rider-facing copy associated with the safety score.
Avoid unnecessary rounded rectangles in the safety score.
Avoid placing every datum inside its own container in the safety score.
Use one-pixel structural rules when the safety score needs visual grouping.
Use negative space as the first grouping mechanism in the safety score.
Use radial geometry when the safety score represents a measurable quantity.
Use nodes when the safety score represents people or geographic entities.
Use lines when the safety score represents a relationship or sequence.
Use rings when the safety score represents progress, cohesion, or capacity.
Use large numerals when the safety score contains a primary metric.
Use compact labels when the safety score contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive safety score controls.
Provide a larger sixty-four-pixel interaction zone for the most important safety score action during riding.
Do not require precise tapping for critical safety score actions.
Use hold-to-confirm for irreversible or safety-sensitive safety score actions where appropriate.
Provide immediate visual feedback for every interactive safety score action.
Animate the safety score only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the safety score.
Use sixty-to-two-hundred-fifty millisecond transitions for normal safety score UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the safety score.
Use opacity changes to establish secondary hierarchy in the safety score.
Use scale changes sparingly in the safety score.
Avoid large bounce animations in the safety score.
Use subtle glow to indicate active state in the safety score.
Never use glow as the only indicator of an important safety score state.
Pair important safety score states with text, iconography, or geometry.
Preserve the visual hierarchy of the safety score under reduced-motion settings.
Ensure the safety score remains understandable without animation.
Ensure the safety score remains usable at high text zoom.
Ensure the safety score remains usable in strong outdoor light where possible.
Use high contrast between the safety score primary value and its background.
Do not use tiny gray text for essential safety score information.
Keep secondary safety score information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the safety score.
Use uppercase tracking only for short telemetry labels in the safety score.
Use tabular numerals for changing safety score values.
Keep decimal precision consistent across the safety score.
Use locale-aware formatting for distance and speed in the safety score.
Use metric units by default for the safety score when the user is in a metric locale.
Allow unit preferences to be changed in settings for the safety score.
Use safe-area insets around the safety score on mobile devices.
Keep important safety score content away from gesture navigation edges.
Support landscape orientation for riding-focused safety score screens.
Support portrait orientation for planning-focused safety score screens.
Allow the safety score to reorganize rather than simply shrink at smaller widths.
Do not stack every safety score element vertically on mobile.
Use edge rails for compact safety score telemetry on narrow screens.
Use bottom sheets only when the safety score needs temporary detailed interaction.
Avoid permanent bottom sheets for the safety score unless the screen is specifically designed around one.
Keep map gestures available whenever the safety score does not require modal focus.
Prevent accidental map gestures while interacting with critical safety score controls.
Use pointer-events layering intentionally for the safety score.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the safety score.
Use MapLibre layers for geographic information whenever possible for the safety score.
Use DOM overlays only for interaction-heavy safety score controls.
Keep route geometry visually dominant over secondary map labels in the safety score.
Dim irrelevant map detail behind active safety score guidance.
Use a clear active route line for the safety score.
Use a thinner inactive route line for alternate safety score paths.
Use checkpoint nodes to divide long safety score journeys into understandable segments.
Use start and destination markers consistently in the safety score.
Use directional orientation for moving rider markers in the safety score.
Avoid using generic pins for every safety score object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the safety score.
Use clustering when many safety score entities overlap.
Use expansion behavior when a safety score cluster is selected.
Use proximity to determine emphasis for nearby safety score entities.
Use distance labels only when distance is actionable for the safety score.
Use live state indicators for connected safety score entities.
Use stale-state indicators when safety score data has not updated recently.
Never imply live safety score data when the network is offline.
Clearly communicate offline state within the safety score.
Use cached data gracefully for the safety score.
Design the safety score to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the safety score.
Show network state without turning the safety score into a diagnostic screen.
Keep system diagnostics secondary to the safety score user goal.
Use haptic-ready interaction semantics for the safety score where supported.
Use sound-ready states for the safety score where auditory feedback is useful.
Do not make sound the only indication of a critical safety score state.
Use clear visual acknowledgment after the safety score receives an action.
Use optimistic feedback only when the safety score action can safely be reversed.
Use progress indicators for long-running safety score operations.
Use skeletons only when they help preserve the safety score layout.
Avoid generic spinner-only loading states for major safety score screens.
Provide purposeful empty states for the safety score.
Provide recovery actions for safety score errors.
Keep error messages concise and actionable in the safety score.
Use a technical but human tone for safety score system messages.
Never use jargon that the rider cannot understand in the safety score.
Keep safety-critical copy direct and unambiguous in the safety score.
Validate the safety score at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the safety score at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the safety score in both portrait and landscape layouts.
Validate the safety score with long rider names.
Validate the safety score with long route names.
Validate the safety score with zero riders.
Validate the safety score with one rider.
Validate the safety score with a full group.
Validate the safety score with slow network conditions.
Validate the safety score with no network.
Validate the safety score with poor GPS accuracy.
Validate the safety score with rapidly changing telemetry.
Validate the safety score with accessibility text scaling.
Validate the safety score with reduced motion.
Validate the safety score with keyboard navigation where applicable.
Validate the safety score with screen readers for non-driving planning contexts.
Validate the safety score with touch and pointer input.
Validate the safety score with glove-friendly target sizing.
Document every interactive state of the safety score.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the safety score.
Create a reusable component contract for the safety score.
Keep component APIs semantic rather than visual-only for the safety score.
Separate data state from presentation state in the safety score.
Keep animation state separate from business state in the safety score.
Avoid hardcoding user-specific values into the safety score.
Drive safety score values from the application's data layer.
Keep the safety score resilient to missing optional data.
Keep the safety score deterministic during replay or ride-history inspection.
Use consistent time formatting across the safety score.
Use consistent distance formatting across the safety score.
Use consistent rider status terminology across the safety score.
Use consistent alert severity terminology across the safety score.
Use consistent route terminology across the safety score.
Use consistent checkpoint terminology across the safety score.
Use consistent connection terminology across the safety score.
Do not introduce a new visual pattern for the safety score if an existing pattern already solves the same problem.
Prefer composition over component nesting in the safety score.
Keep the visual surface of the safety score calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary safety score information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the safety score.
Use the reference HMI's instrument-panel logic as inspiration for the safety score.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the safety score feel native to Rideclub's spatial operating-system concept.
The final safety score must not look like a generic admin dashboard.
The final safety score must not look like a generic fintech dashboard.
The final safety score must not look like a generic social feed.
The final safety score must not look like a generic navigation clone.
The final safety score must feel like one cohesive Rideclub cockpit.
# 53 — RIDE BEHAVIOR
Define the ride behavior as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the ride behavior benefits from geographic awareness.
Use a restrained near-black foundation behind the ride behavior.
Use #F4F7FA for primary readable values in the ride behavior.
Use #AAB1BD for supporting labels in the ride behavior.
Use #66707D for low-priority metadata in the ride behavior.
Use #FF4D21 only for Rideclub-primary actions in the ride behavior.
Use cyan for live communication state when applicable to the ride behavior.
Use green for successful or healthy state when applicable to the ride behavior.
Use amber for caution state when applicable to the ride behavior.
Use red only for critical state when applicable to the ride behavior.
Use technical typography for telemetry values associated with the ride behavior.
Use human-readable typography for rider-facing copy associated with the ride behavior.
Avoid unnecessary rounded rectangles in the ride behavior.
Avoid placing every datum inside its own container in the ride behavior.
Use one-pixel structural rules when the ride behavior needs visual grouping.
Use negative space as the first grouping mechanism in the ride behavior.
Use radial geometry when the ride behavior represents a measurable quantity.
Use nodes when the ride behavior represents people or geographic entities.
Use lines when the ride behavior represents a relationship or sequence.
Use rings when the ride behavior represents progress, cohesion, or capacity.
Use large numerals when the ride behavior contains a primary metric.
Use compact labels when the ride behavior contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive ride behavior controls.
Provide a larger sixty-four-pixel interaction zone for the most important ride behavior action during riding.
Do not require precise tapping for critical ride behavior actions.
Use hold-to-confirm for irreversible or safety-sensitive ride behavior actions where appropriate.
Provide immediate visual feedback for every interactive ride behavior action.
Animate the ride behavior only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the ride behavior.
Use sixty-to-two-hundred-fifty millisecond transitions for normal ride behavior UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the ride behavior.
Use opacity changes to establish secondary hierarchy in the ride behavior.
Use scale changes sparingly in the ride behavior.
Avoid large bounce animations in the ride behavior.
Use subtle glow to indicate active state in the ride behavior.
Never use glow as the only indicator of an important ride behavior state.
Pair important ride behavior states with text, iconography, or geometry.
Preserve the visual hierarchy of the ride behavior under reduced-motion settings.
Ensure the ride behavior remains understandable without animation.
Ensure the ride behavior remains usable at high text zoom.
Ensure the ride behavior remains usable in strong outdoor light where possible.
Use high contrast between the ride behavior primary value and its background.
Do not use tiny gray text for essential ride behavior information.
Keep secondary ride behavior information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the ride behavior.
Use uppercase tracking only for short telemetry labels in the ride behavior.
Use tabular numerals for changing ride behavior values.
Keep decimal precision consistent across the ride behavior.
Use locale-aware formatting for distance and speed in the ride behavior.
Use metric units by default for the ride behavior when the user is in a metric locale.
Allow unit preferences to be changed in settings for the ride behavior.
Use safe-area insets around the ride behavior on mobile devices.
Keep important ride behavior content away from gesture navigation edges.
Support landscape orientation for riding-focused ride behavior screens.
Support portrait orientation for planning-focused ride behavior screens.
Allow the ride behavior to reorganize rather than simply shrink at smaller widths.
Do not stack every ride behavior element vertically on mobile.
Use edge rails for compact ride behavior telemetry on narrow screens.
Use bottom sheets only when the ride behavior needs temporary detailed interaction.
Avoid permanent bottom sheets for the ride behavior unless the screen is specifically designed around one.
Keep map gestures available whenever the ride behavior does not require modal focus.
Prevent accidental map gestures while interacting with critical ride behavior controls.
Use pointer-events layering intentionally for the ride behavior.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the ride behavior.
Use MapLibre layers for geographic information whenever possible for the ride behavior.
Use DOM overlays only for interaction-heavy ride behavior controls.
Keep route geometry visually dominant over secondary map labels in the ride behavior.
Dim irrelevant map detail behind active ride behavior guidance.
Use a clear active route line for the ride behavior.
Use a thinner inactive route line for alternate ride behavior paths.
Use checkpoint nodes to divide long ride behavior journeys into understandable segments.
Use start and destination markers consistently in the ride behavior.
Use directional orientation for moving rider markers in the ride behavior.
Avoid using generic pins for every ride behavior object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the ride behavior.
Use clustering when many ride behavior entities overlap.
Use expansion behavior when a ride behavior cluster is selected.
Use proximity to determine emphasis for nearby ride behavior entities.
Use distance labels only when distance is actionable for the ride behavior.
Use live state indicators for connected ride behavior entities.
Use stale-state indicators when ride behavior data has not updated recently.
Never imply live ride behavior data when the network is offline.
Clearly communicate offline state within the ride behavior.
Use cached data gracefully for the ride behavior.
Design the ride behavior to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the ride behavior.
Show network state without turning the ride behavior into a diagnostic screen.
Keep system diagnostics secondary to the ride behavior user goal.
Use haptic-ready interaction semantics for the ride behavior where supported.
Use sound-ready states for the ride behavior where auditory feedback is useful.
Do not make sound the only indication of a critical ride behavior state.
Use clear visual acknowledgment after the ride behavior receives an action.
Use optimistic feedback only when the ride behavior action can safely be reversed.
Use progress indicators for long-running ride behavior operations.
Use skeletons only when they help preserve the ride behavior layout.
Avoid generic spinner-only loading states for major ride behavior screens.
Provide purposeful empty states for the ride behavior.
Provide recovery actions for ride behavior errors.
Keep error messages concise and actionable in the ride behavior.
Use a technical but human tone for ride behavior system messages.
Never use jargon that the rider cannot understand in the ride behavior.
Keep safety-critical copy direct and unambiguous in the ride behavior.
Validate the ride behavior at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the ride behavior at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the ride behavior in both portrait and landscape layouts.
Validate the ride behavior with long rider names.
Validate the ride behavior with long route names.
Validate the ride behavior with zero riders.
Validate the ride behavior with one rider.
Validate the ride behavior with a full group.
Validate the ride behavior with slow network conditions.
Validate the ride behavior with no network.
Validate the ride behavior with poor GPS accuracy.
Validate the ride behavior with rapidly changing telemetry.
Validate the ride behavior with accessibility text scaling.
Validate the ride behavior with reduced motion.
Validate the ride behavior with keyboard navigation where applicable.
Validate the ride behavior with screen readers for non-driving planning contexts.
Validate the ride behavior with touch and pointer input.
Validate the ride behavior with glove-friendly target sizing.
Document every interactive state of the ride behavior.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the ride behavior.
Create a reusable component contract for the ride behavior.
Keep component APIs semantic rather than visual-only for the ride behavior.
Separate data state from presentation state in the ride behavior.
Keep animation state separate from business state in the ride behavior.
Avoid hardcoding user-specific values into the ride behavior.
Drive ride behavior values from the application's data layer.
Keep the ride behavior resilient to missing optional data.
Keep the ride behavior deterministic during replay or ride-history inspection.
Use consistent time formatting across the ride behavior.
Use consistent distance formatting across the ride behavior.
Use consistent rider status terminology across the ride behavior.
Use consistent alert severity terminology across the ride behavior.
Use consistent route terminology across the ride behavior.
Use consistent checkpoint terminology across the ride behavior.
Use consistent connection terminology across the ride behavior.
Do not introduce a new visual pattern for the ride behavior if an existing pattern already solves the same problem.
Prefer composition over component nesting in the ride behavior.
Keep the visual surface of the ride behavior calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary ride behavior information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the ride behavior.
Use the reference HMI's instrument-panel logic as inspiration for the ride behavior.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the ride behavior feel native to Rideclub's spatial operating-system concept.
The final ride behavior must not look like a generic admin dashboard.
The final ride behavior must not look like a generic fintech dashboard.
The final ride behavior must not look like a generic social feed.
The final ride behavior must not look like a generic navigation clone.
The final ride behavior must feel like one cohesive Rideclub cockpit.
# 54 — AI RIDE INTELLIGENCE
Define the AI ride intelligence as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the AI ride intelligence benefits from geographic awareness.
Use a restrained near-black foundation behind the AI ride intelligence.
Use #F4F7FA for primary readable values in the AI ride intelligence.
Use #AAB1BD for supporting labels in the AI ride intelligence.
Use #66707D for low-priority metadata in the AI ride intelligence.
Use #FF4D21 only for Rideclub-primary actions in the AI ride intelligence.
Use cyan for live communication state when applicable to the AI ride intelligence.
Use green for successful or healthy state when applicable to the AI ride intelligence.
Use amber for caution state when applicable to the AI ride intelligence.
Use red only for critical state when applicable to the AI ride intelligence.
Use technical typography for telemetry values associated with the AI ride intelligence.
Use human-readable typography for rider-facing copy associated with the AI ride intelligence.
Avoid unnecessary rounded rectangles in the AI ride intelligence.
Avoid placing every datum inside its own container in the AI ride intelligence.
Use one-pixel structural rules when the AI ride intelligence needs visual grouping.
Use negative space as the first grouping mechanism in the AI ride intelligence.
Use radial geometry when the AI ride intelligence represents a measurable quantity.
Use nodes when the AI ride intelligence represents people or geographic entities.
Use lines when the AI ride intelligence represents a relationship or sequence.
Use rings when the AI ride intelligence represents progress, cohesion, or capacity.
Use large numerals when the AI ride intelligence contains a primary metric.
Use compact labels when the AI ride intelligence contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive AI ride intelligence controls.
Provide a larger sixty-four-pixel interaction zone for the most important AI ride intelligence action during riding.
Do not require precise tapping for critical AI ride intelligence actions.
Use hold-to-confirm for irreversible or safety-sensitive AI ride intelligence actions where appropriate.
Provide immediate visual feedback for every interactive AI ride intelligence action.
Animate the AI ride intelligence only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the AI ride intelligence.
Use sixty-to-two-hundred-fifty millisecond transitions for normal AI ride intelligence UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the AI ride intelligence.
Use opacity changes to establish secondary hierarchy in the AI ride intelligence.
Use scale changes sparingly in the AI ride intelligence.
Avoid large bounce animations in the AI ride intelligence.
Use subtle glow to indicate active state in the AI ride intelligence.
Never use glow as the only indicator of an important AI ride intelligence state.
Pair important AI ride intelligence states with text, iconography, or geometry.
Preserve the visual hierarchy of the AI ride intelligence under reduced-motion settings.
Ensure the AI ride intelligence remains understandable without animation.
Ensure the AI ride intelligence remains usable at high text zoom.
Ensure the AI ride intelligence remains usable in strong outdoor light where possible.
Use high contrast between the AI ride intelligence primary value and its background.
Do not use tiny gray text for essential AI ride intelligence information.
Keep secondary AI ride intelligence information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the AI ride intelligence.
Use uppercase tracking only for short telemetry labels in the AI ride intelligence.
Use tabular numerals for changing AI ride intelligence values.
Keep decimal precision consistent across the AI ride intelligence.
Use locale-aware formatting for distance and speed in the AI ride intelligence.
Use metric units by default for the AI ride intelligence when the user is in a metric locale.
Allow unit preferences to be changed in settings for the AI ride intelligence.
Use safe-area insets around the AI ride intelligence on mobile devices.
Keep important AI ride intelligence content away from gesture navigation edges.
Support landscape orientation for riding-focused AI ride intelligence screens.
Support portrait orientation for planning-focused AI ride intelligence screens.
Allow the AI ride intelligence to reorganize rather than simply shrink at smaller widths.
Do not stack every AI ride intelligence element vertically on mobile.
Use edge rails for compact AI ride intelligence telemetry on narrow screens.
Use bottom sheets only when the AI ride intelligence needs temporary detailed interaction.
Avoid permanent bottom sheets for the AI ride intelligence unless the screen is specifically designed around one.
Keep map gestures available whenever the AI ride intelligence does not require modal focus.
Prevent accidental map gestures while interacting with critical AI ride intelligence controls.
Use pointer-events layering intentionally for the AI ride intelligence.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the AI ride intelligence.
Use MapLibre layers for geographic information whenever possible for the AI ride intelligence.
Use DOM overlays only for interaction-heavy AI ride intelligence controls.
Keep route geometry visually dominant over secondary map labels in the AI ride intelligence.
Dim irrelevant map detail behind active AI ride intelligence guidance.
Use a clear active route line for the AI ride intelligence.
Use a thinner inactive route line for alternate AI ride intelligence paths.
Use checkpoint nodes to divide long AI ride intelligence journeys into understandable segments.
Use start and destination markers consistently in the AI ride intelligence.
Use directional orientation for moving rider markers in the AI ride intelligence.
Avoid using generic pins for every AI ride intelligence object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the AI ride intelligence.
Use clustering when many AI ride intelligence entities overlap.
Use expansion behavior when a AI ride intelligence cluster is selected.
Use proximity to determine emphasis for nearby AI ride intelligence entities.
Use distance labels only when distance is actionable for the AI ride intelligence.
Use live state indicators for connected AI ride intelligence entities.
Use stale-state indicators when AI ride intelligence data has not updated recently.
Never imply live AI ride intelligence data when the network is offline.
Clearly communicate offline state within the AI ride intelligence.
Use cached data gracefully for the AI ride intelligence.
Design the AI ride intelligence to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the AI ride intelligence.
Show network state without turning the AI ride intelligence into a diagnostic screen.
Keep system diagnostics secondary to the AI ride intelligence user goal.
Use haptic-ready interaction semantics for the AI ride intelligence where supported.
Use sound-ready states for the AI ride intelligence where auditory feedback is useful.
Do not make sound the only indication of a critical AI ride intelligence state.
Use clear visual acknowledgment after the AI ride intelligence receives an action.
Use optimistic feedback only when the AI ride intelligence action can safely be reversed.
Use progress indicators for long-running AI ride intelligence operations.
Use skeletons only when they help preserve the AI ride intelligence layout.
Avoid generic spinner-only loading states for major AI ride intelligence screens.
Provide purposeful empty states for the AI ride intelligence.
Provide recovery actions for AI ride intelligence errors.
Keep error messages concise and actionable in the AI ride intelligence.
Use a technical but human tone for AI ride intelligence system messages.
Never use jargon that the rider cannot understand in the AI ride intelligence.
Keep safety-critical copy direct and unambiguous in the AI ride intelligence.
Validate the AI ride intelligence at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the AI ride intelligence at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the AI ride intelligence in both portrait and landscape layouts.
Validate the AI ride intelligence with long rider names.
Validate the AI ride intelligence with long route names.
Validate the AI ride intelligence with zero riders.
Validate the AI ride intelligence with one rider.
Validate the AI ride intelligence with a full group.
Validate the AI ride intelligence with slow network conditions.
Validate the AI ride intelligence with no network.
Validate the AI ride intelligence with poor GPS accuracy.
Validate the AI ride intelligence with rapidly changing telemetry.
Validate the AI ride intelligence with accessibility text scaling.
Validate the AI ride intelligence with reduced motion.
Validate the AI ride intelligence with keyboard navigation where applicable.
Validate the AI ride intelligence with screen readers for non-driving planning contexts.
Validate the AI ride intelligence with touch and pointer input.
Validate the AI ride intelligence with glove-friendly target sizing.
Document every interactive state of the AI ride intelligence.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the AI ride intelligence.
Create a reusable component contract for the AI ride intelligence.
Keep component APIs semantic rather than visual-only for the AI ride intelligence.
Separate data state from presentation state in the AI ride intelligence.
Keep animation state separate from business state in the AI ride intelligence.
Avoid hardcoding user-specific values into the AI ride intelligence.
Drive AI ride intelligence values from the application's data layer.
Keep the AI ride intelligence resilient to missing optional data.
Keep the AI ride intelligence deterministic during replay or ride-history inspection.
Use consistent time formatting across the AI ride intelligence.
Use consistent distance formatting across the AI ride intelligence.
Use consistent rider status terminology across the AI ride intelligence.
Use consistent alert severity terminology across the AI ride intelligence.
Use consistent route terminology across the AI ride intelligence.
Use consistent checkpoint terminology across the AI ride intelligence.
Use consistent connection terminology across the AI ride intelligence.
Do not introduce a new visual pattern for the AI ride intelligence if an existing pattern already solves the same problem.
Prefer composition over component nesting in the AI ride intelligence.
Keep the visual surface of the AI ride intelligence calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary AI ride intelligence information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the AI ride intelligence.
Use the reference HMI's instrument-panel logic as inspiration for the AI ride intelligence.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the AI ride intelligence feel native to Rideclub's spatial operating-system concept.
The final AI ride intelligence must not look like a generic admin dashboard.
The final AI ride intelligence must not look like a generic fintech dashboard.
The final AI ride intelligence must not look like a generic social feed.
The final AI ride intelligence must not look like a generic navigation clone.
The final AI ride intelligence must feel like one cohesive Rideclub cockpit.
# 55 — PREDICTIVE SEPARATION
Define the predictive separation as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the predictive separation benefits from geographic awareness.
Use a restrained near-black foundation behind the predictive separation.
Use #F4F7FA for primary readable values in the predictive separation.
Use #AAB1BD for supporting labels in the predictive separation.
Use #66707D for low-priority metadata in the predictive separation.
Use #FF4D21 only for Rideclub-primary actions in the predictive separation.
Use cyan for live communication state when applicable to the predictive separation.
Use green for successful or healthy state when applicable to the predictive separation.
Use amber for caution state when applicable to the predictive separation.
Use red only for critical state when applicable to the predictive separation.
Use technical typography for telemetry values associated with the predictive separation.
Use human-readable typography for rider-facing copy associated with the predictive separation.
Avoid unnecessary rounded rectangles in the predictive separation.
Avoid placing every datum inside its own container in the predictive separation.
Use one-pixel structural rules when the predictive separation needs visual grouping.
Use negative space as the first grouping mechanism in the predictive separation.
Use radial geometry when the predictive separation represents a measurable quantity.
Use nodes when the predictive separation represents people or geographic entities.
Use lines when the predictive separation represents a relationship or sequence.
Use rings when the predictive separation represents progress, cohesion, or capacity.
Use large numerals when the predictive separation contains a primary metric.
Use compact labels when the predictive separation contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive predictive separation controls.
Provide a larger sixty-four-pixel interaction zone for the most important predictive separation action during riding.
Do not require precise tapping for critical predictive separation actions.
Use hold-to-confirm for irreversible or safety-sensitive predictive separation actions where appropriate.
Provide immediate visual feedback for every interactive predictive separation action.
Animate the predictive separation only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the predictive separation.
Use sixty-to-two-hundred-fifty millisecond transitions for normal predictive separation UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the predictive separation.
Use opacity changes to establish secondary hierarchy in the predictive separation.
Use scale changes sparingly in the predictive separation.
Avoid large bounce animations in the predictive separation.
Use subtle glow to indicate active state in the predictive separation.
Never use glow as the only indicator of an important predictive separation state.
Pair important predictive separation states with text, iconography, or geometry.
Preserve the visual hierarchy of the predictive separation under reduced-motion settings.
Ensure the predictive separation remains understandable without animation.
Ensure the predictive separation remains usable at high text zoom.
Ensure the predictive separation remains usable in strong outdoor light where possible.
Use high contrast between the predictive separation primary value and its background.
Do not use tiny gray text for essential predictive separation information.
Keep secondary predictive separation information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the predictive separation.
Use uppercase tracking only for short telemetry labels in the predictive separation.
Use tabular numerals for changing predictive separation values.
Keep decimal precision consistent across the predictive separation.
Use locale-aware formatting for distance and speed in the predictive separation.
Use metric units by default for the predictive separation when the user is in a metric locale.
Allow unit preferences to be changed in settings for the predictive separation.
Use safe-area insets around the predictive separation on mobile devices.
Keep important predictive separation content away from gesture navigation edges.
Support landscape orientation for riding-focused predictive separation screens.
Support portrait orientation for planning-focused predictive separation screens.
Allow the predictive separation to reorganize rather than simply shrink at smaller widths.
Do not stack every predictive separation element vertically on mobile.
Use edge rails for compact predictive separation telemetry on narrow screens.
Use bottom sheets only when the predictive separation needs temporary detailed interaction.
Avoid permanent bottom sheets for the predictive separation unless the screen is specifically designed around one.
Keep map gestures available whenever the predictive separation does not require modal focus.
Prevent accidental map gestures while interacting with critical predictive separation controls.
Use pointer-events layering intentionally for the predictive separation.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the predictive separation.
Use MapLibre layers for geographic information whenever possible for the predictive separation.
Use DOM overlays only for interaction-heavy predictive separation controls.
Keep route geometry visually dominant over secondary map labels in the predictive separation.
Dim irrelevant map detail behind active predictive separation guidance.
Use a clear active route line for the predictive separation.
Use a thinner inactive route line for alternate predictive separation paths.
Use checkpoint nodes to divide long predictive separation journeys into understandable segments.
Use start and destination markers consistently in the predictive separation.
Use directional orientation for moving rider markers in the predictive separation.
Avoid using generic pins for every predictive separation object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the predictive separation.
Use clustering when many predictive separation entities overlap.
Use expansion behavior when a predictive separation cluster is selected.
Use proximity to determine emphasis for nearby predictive separation entities.
Use distance labels only when distance is actionable for the predictive separation.
Use live state indicators for connected predictive separation entities.
Use stale-state indicators when predictive separation data has not updated recently.
Never imply live predictive separation data when the network is offline.
Clearly communicate offline state within the predictive separation.
Use cached data gracefully for the predictive separation.
Design the predictive separation to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the predictive separation.
Show network state without turning the predictive separation into a diagnostic screen.
Keep system diagnostics secondary to the predictive separation user goal.
Use haptic-ready interaction semantics for the predictive separation where supported.
Use sound-ready states for the predictive separation where auditory feedback is useful.
Do not make sound the only indication of a critical predictive separation state.
Use clear visual acknowledgment after the predictive separation receives an action.
Use optimistic feedback only when the predictive separation action can safely be reversed.
Use progress indicators for long-running predictive separation operations.
Use skeletons only when they help preserve the predictive separation layout.
Avoid generic spinner-only loading states for major predictive separation screens.
Provide purposeful empty states for the predictive separation.
Provide recovery actions for predictive separation errors.
Keep error messages concise and actionable in the predictive separation.
Use a technical but human tone for predictive separation system messages.
Never use jargon that the rider cannot understand in the predictive separation.
Keep safety-critical copy direct and unambiguous in the predictive separation.
Validate the predictive separation at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the predictive separation at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the predictive separation in both portrait and landscape layouts.
Validate the predictive separation with long rider names.
Validate the predictive separation with long route names.
Validate the predictive separation with zero riders.
Validate the predictive separation with one rider.
Validate the predictive separation with a full group.
Validate the predictive separation with slow network conditions.
Validate the predictive separation with no network.
Validate the predictive separation with poor GPS accuracy.
Validate the predictive separation with rapidly changing telemetry.
Validate the predictive separation with accessibility text scaling.
Validate the predictive separation with reduced motion.
Validate the predictive separation with keyboard navigation where applicable.
Validate the predictive separation with screen readers for non-driving planning contexts.
Validate the predictive separation with touch and pointer input.
Validate the predictive separation with glove-friendly target sizing.
Document every interactive state of the predictive separation.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the predictive separation.
Create a reusable component contract for the predictive separation.
Keep component APIs semantic rather than visual-only for the predictive separation.
Separate data state from presentation state in the predictive separation.
Keep animation state separate from business state in the predictive separation.
Avoid hardcoding user-specific values into the predictive separation.
Drive predictive separation values from the application's data layer.
Keep the predictive separation resilient to missing optional data.
Keep the predictive separation deterministic during replay or ride-history inspection.
Use consistent time formatting across the predictive separation.
Use consistent distance formatting across the predictive separation.
Use consistent rider status terminology across the predictive separation.
Use consistent alert severity terminology across the predictive separation.
Use consistent route terminology across the predictive separation.
Use consistent checkpoint terminology across the predictive separation.
Use consistent connection terminology across the predictive separation.
Do not introduce a new visual pattern for the predictive separation if an existing pattern already solves the same problem.
Prefer composition over component nesting in the predictive separation.
Keep the visual surface of the predictive separation calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary predictive separation information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the predictive separation.
Use the reference HMI's instrument-panel logic as inspiration for the predictive separation.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the predictive separation feel native to Rideclub's spatial operating-system concept.
The final predictive separation must not look like a generic admin dashboard.
The final predictive separation must not look like a generic fintech dashboard.
The final predictive separation must not look like a generic social feed.
The final predictive separation must not look like a generic navigation clone.
The final predictive separation must feel like one cohesive Rideclub cockpit.
# 56 — GROUP SAFETY
Define the group safety as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the group safety benefits from geographic awareness.
Use a restrained near-black foundation behind the group safety.
Use #F4F7FA for primary readable values in the group safety.
Use #AAB1BD for supporting labels in the group safety.
Use #66707D for low-priority metadata in the group safety.
Use #FF4D21 only for Rideclub-primary actions in the group safety.
Use cyan for live communication state when applicable to the group safety.
Use green for successful or healthy state when applicable to the group safety.
Use amber for caution state when applicable to the group safety.
Use red only for critical state when applicable to the group safety.
Use technical typography for telemetry values associated with the group safety.
Use human-readable typography for rider-facing copy associated with the group safety.
Avoid unnecessary rounded rectangles in the group safety.
Avoid placing every datum inside its own container in the group safety.
Use one-pixel structural rules when the group safety needs visual grouping.
Use negative space as the first grouping mechanism in the group safety.
Use radial geometry when the group safety represents a measurable quantity.
Use nodes when the group safety represents people or geographic entities.
Use lines when the group safety represents a relationship or sequence.
Use rings when the group safety represents progress, cohesion, or capacity.
Use large numerals when the group safety contains a primary metric.
Use compact labels when the group safety contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive group safety controls.
Provide a larger sixty-four-pixel interaction zone for the most important group safety action during riding.
Do not require precise tapping for critical group safety actions.
Use hold-to-confirm for irreversible or safety-sensitive group safety actions where appropriate.
Provide immediate visual feedback for every interactive group safety action.
Animate the group safety only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the group safety.
Use sixty-to-two-hundred-fifty millisecond transitions for normal group safety UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the group safety.
Use opacity changes to establish secondary hierarchy in the group safety.
Use scale changes sparingly in the group safety.
Avoid large bounce animations in the group safety.
Use subtle glow to indicate active state in the group safety.
Never use glow as the only indicator of an important group safety state.
Pair important group safety states with text, iconography, or geometry.
Preserve the visual hierarchy of the group safety under reduced-motion settings.
Ensure the group safety remains understandable without animation.
Ensure the group safety remains usable at high text zoom.
Ensure the group safety remains usable in strong outdoor light where possible.
Use high contrast between the group safety primary value and its background.
Do not use tiny gray text for essential group safety information.
Keep secondary group safety information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the group safety.
Use uppercase tracking only for short telemetry labels in the group safety.
Use tabular numerals for changing group safety values.
Keep decimal precision consistent across the group safety.
Use locale-aware formatting for distance and speed in the group safety.
Use metric units by default for the group safety when the user is in a metric locale.
Allow unit preferences to be changed in settings for the group safety.
Use safe-area insets around the group safety on mobile devices.
Keep important group safety content away from gesture navigation edges.
Support landscape orientation for riding-focused group safety screens.
Support portrait orientation for planning-focused group safety screens.
Allow the group safety to reorganize rather than simply shrink at smaller widths.
Do not stack every group safety element vertically on mobile.
Use edge rails for compact group safety telemetry on narrow screens.
Use bottom sheets only when the group safety needs temporary detailed interaction.
Avoid permanent bottom sheets for the group safety unless the screen is specifically designed around one.
Keep map gestures available whenever the group safety does not require modal focus.
Prevent accidental map gestures while interacting with critical group safety controls.
Use pointer-events layering intentionally for the group safety.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the group safety.
Use MapLibre layers for geographic information whenever possible for the group safety.
Use DOM overlays only for interaction-heavy group safety controls.
Keep route geometry visually dominant over secondary map labels in the group safety.
Dim irrelevant map detail behind active group safety guidance.
Use a clear active route line for the group safety.
Use a thinner inactive route line for alternate group safety paths.
Use checkpoint nodes to divide long group safety journeys into understandable segments.
Use start and destination markers consistently in the group safety.
Use directional orientation for moving rider markers in the group safety.
Avoid using generic pins for every group safety object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the group safety.
Use clustering when many group safety entities overlap.
Use expansion behavior when a group safety cluster is selected.
Use proximity to determine emphasis for nearby group safety entities.
Use distance labels only when distance is actionable for the group safety.
Use live state indicators for connected group safety entities.
Use stale-state indicators when group safety data has not updated recently.
Never imply live group safety data when the network is offline.
Clearly communicate offline state within the group safety.
Use cached data gracefully for the group safety.
Design the group safety to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the group safety.
Show network state without turning the group safety into a diagnostic screen.
Keep system diagnostics secondary to the group safety user goal.
Use haptic-ready interaction semantics for the group safety where supported.
Use sound-ready states for the group safety where auditory feedback is useful.
Do not make sound the only indication of a critical group safety state.
Use clear visual acknowledgment after the group safety receives an action.
Use optimistic feedback only when the group safety action can safely be reversed.
Use progress indicators for long-running group safety operations.
Use skeletons only when they help preserve the group safety layout.
Avoid generic spinner-only loading states for major group safety screens.
Provide purposeful empty states for the group safety.
Provide recovery actions for group safety errors.
Keep error messages concise and actionable in the group safety.
Use a technical but human tone for group safety system messages.
Never use jargon that the rider cannot understand in the group safety.
Keep safety-critical copy direct and unambiguous in the group safety.
Validate the group safety at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the group safety at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the group safety in both portrait and landscape layouts.
Validate the group safety with long rider names.
Validate the group safety with long route names.
Validate the group safety with zero riders.
Validate the group safety with one rider.
Validate the group safety with a full group.
Validate the group safety with slow network conditions.
Validate the group safety with no network.
Validate the group safety with poor GPS accuracy.
Validate the group safety with rapidly changing telemetry.
Validate the group safety with accessibility text scaling.
Validate the group safety with reduced motion.
Validate the group safety with keyboard navigation where applicable.
Validate the group safety with screen readers for non-driving planning contexts.
Validate the group safety with touch and pointer input.
Validate the group safety with glove-friendly target sizing.
Document every interactive state of the group safety.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the group safety.
Create a reusable component contract for the group safety.
Keep component APIs semantic rather than visual-only for the group safety.
Separate data state from presentation state in the group safety.
Keep animation state separate from business state in the group safety.
Avoid hardcoding user-specific values into the group safety.
Drive group safety values from the application's data layer.
Keep the group safety resilient to missing optional data.
Keep the group safety deterministic during replay or ride-history inspection.
Use consistent time formatting across the group safety.
Use consistent distance formatting across the group safety.
Use consistent rider status terminology across the group safety.
Use consistent alert severity terminology across the group safety.
Use consistent route terminology across the group safety.
Use consistent checkpoint terminology across the group safety.
Use consistent connection terminology across the group safety.
Do not introduce a new visual pattern for the group safety if an existing pattern already solves the same problem.
Prefer composition over component nesting in the group safety.
Keep the visual surface of the group safety calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary group safety information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the group safety.
Use the reference HMI's instrument-panel logic as inspiration for the group safety.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the group safety feel native to Rideclub's spatial operating-system concept.
The final group safety must not look like a generic admin dashboard.
The final group safety must not look like a generic fintech dashboard.
The final group safety must not look like a generic social feed.
The final group safety must not look like a generic navigation clone.
The final group safety must feel like one cohesive Rideclub cockpit.
# 57 — TELEMETRY
Define the telemetry as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the telemetry benefits from geographic awareness.
Use a restrained near-black foundation behind the telemetry.
Use #F4F7FA for primary readable values in the telemetry.
Use #AAB1BD for supporting labels in the telemetry.
Use #66707D for low-priority metadata in the telemetry.
Use #FF4D21 only for Rideclub-primary actions in the telemetry.
Use cyan for live communication state when applicable to the telemetry.
Use green for successful or healthy state when applicable to the telemetry.
Use amber for caution state when applicable to the telemetry.
Use red only for critical state when applicable to the telemetry.
Use technical typography for telemetry values associated with the telemetry.
Use human-readable typography for rider-facing copy associated with the telemetry.
Avoid unnecessary rounded rectangles in the telemetry.
Avoid placing every datum inside its own container in the telemetry.
Use one-pixel structural rules when the telemetry needs visual grouping.
Use negative space as the first grouping mechanism in the telemetry.
Use radial geometry when the telemetry represents a measurable quantity.
Use nodes when the telemetry represents people or geographic entities.
Use lines when the telemetry represents a relationship or sequence.
Use rings when the telemetry represents progress, cohesion, or capacity.
Use large numerals when the telemetry contains a primary metric.
Use compact labels when the telemetry contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive telemetry controls.
Provide a larger sixty-four-pixel interaction zone for the most important telemetry action during riding.
Do not require precise tapping for critical telemetry actions.
Use hold-to-confirm for irreversible or safety-sensitive telemetry actions where appropriate.
Provide immediate visual feedback for every interactive telemetry action.
Animate the telemetry only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the telemetry.
Use sixty-to-two-hundred-fifty millisecond transitions for normal telemetry UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the telemetry.
Use opacity changes to establish secondary hierarchy in the telemetry.
Use scale changes sparingly in the telemetry.
Avoid large bounce animations in the telemetry.
Use subtle glow to indicate active state in the telemetry.
Never use glow as the only indicator of an important telemetry state.
Pair important telemetry states with text, iconography, or geometry.
Preserve the visual hierarchy of the telemetry under reduced-motion settings.
Ensure the telemetry remains understandable without animation.
Ensure the telemetry remains usable at high text zoom.
Ensure the telemetry remains usable in strong outdoor light where possible.
Use high contrast between the telemetry primary value and its background.
Do not use tiny gray text for essential telemetry information.
Keep secondary telemetry information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the telemetry.
Use uppercase tracking only for short telemetry labels in the telemetry.
Use tabular numerals for changing telemetry values.
Keep decimal precision consistent across the telemetry.
Use locale-aware formatting for distance and speed in the telemetry.
Use metric units by default for the telemetry when the user is in a metric locale.
Allow unit preferences to be changed in settings for the telemetry.
Use safe-area insets around the telemetry on mobile devices.
Keep important telemetry content away from gesture navigation edges.
Support landscape orientation for riding-focused telemetry screens.
Support portrait orientation for planning-focused telemetry screens.
Allow the telemetry to reorganize rather than simply shrink at smaller widths.
Do not stack every telemetry element vertically on mobile.
Use edge rails for compact telemetry telemetry on narrow screens.
Use bottom sheets only when the telemetry needs temporary detailed interaction.
Avoid permanent bottom sheets for the telemetry unless the screen is specifically designed around one.
Keep map gestures available whenever the telemetry does not require modal focus.
Prevent accidental map gestures while interacting with critical telemetry controls.
Use pointer-events layering intentionally for the telemetry.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the telemetry.
Use MapLibre layers for geographic information whenever possible for the telemetry.
Use DOM overlays only for interaction-heavy telemetry controls.
Keep route geometry visually dominant over secondary map labels in the telemetry.
Dim irrelevant map detail behind active telemetry guidance.
Use a clear active route line for the telemetry.
Use a thinner inactive route line for alternate telemetry paths.
Use checkpoint nodes to divide long telemetry journeys into understandable segments.
Use start and destination markers consistently in the telemetry.
Use directional orientation for moving rider markers in the telemetry.
Avoid using generic pins for every telemetry object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the telemetry.
Use clustering when many telemetry entities overlap.
Use expansion behavior when a telemetry cluster is selected.
Use proximity to determine emphasis for nearby telemetry entities.
Use distance labels only when distance is actionable for the telemetry.
Use live state indicators for connected telemetry entities.
Use stale-state indicators when telemetry data has not updated recently.
Never imply live telemetry data when the network is offline.
Clearly communicate offline state within the telemetry.
Use cached data gracefully for the telemetry.
Design the telemetry to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the telemetry.
Show network state without turning the telemetry into a diagnostic screen.
Keep system diagnostics secondary to the telemetry user goal.
Use haptic-ready interaction semantics for the telemetry where supported.
Use sound-ready states for the telemetry where auditory feedback is useful.
Do not make sound the only indication of a critical telemetry state.
Use clear visual acknowledgment after the telemetry receives an action.
Use optimistic feedback only when the telemetry action can safely be reversed.
Use progress indicators for long-running telemetry operations.
Use skeletons only when they help preserve the telemetry layout.
Avoid generic spinner-only loading states for major telemetry screens.
Provide purposeful empty states for the telemetry.
Provide recovery actions for telemetry errors.
Keep error messages concise and actionable in the telemetry.
Use a technical but human tone for telemetry system messages.
Never use jargon that the rider cannot understand in the telemetry.
Keep safety-critical copy direct and unambiguous in the telemetry.
Validate the telemetry at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the telemetry at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the telemetry in both portrait and landscape layouts.
Validate the telemetry with long rider names.
Validate the telemetry with long route names.
Validate the telemetry with zero riders.
Validate the telemetry with one rider.
Validate the telemetry with a full group.
Validate the telemetry with slow network conditions.
Validate the telemetry with no network.
Validate the telemetry with poor GPS accuracy.
Validate the telemetry with rapidly changing telemetry.
Validate the telemetry with accessibility text scaling.
Validate the telemetry with reduced motion.
Validate the telemetry with keyboard navigation where applicable.
Validate the telemetry with screen readers for non-driving planning contexts.
Validate the telemetry with touch and pointer input.
Validate the telemetry with glove-friendly target sizing.
Document every interactive state of the telemetry.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the telemetry.
Create a reusable component contract for the telemetry.
Keep component APIs semantic rather than visual-only for the telemetry.
Separate data state from presentation state in the telemetry.
Keep animation state separate from business state in the telemetry.
Avoid hardcoding user-specific values into the telemetry.
Drive telemetry values from the application's data layer.
Keep the telemetry resilient to missing optional data.
Keep the telemetry deterministic during replay or ride-history inspection.
Use consistent time formatting across the telemetry.
Use consistent distance formatting across the telemetry.
Use consistent rider status terminology across the telemetry.
Use consistent alert severity terminology across the telemetry.
Use consistent route terminology across the telemetry.
Use consistent checkpoint terminology across the telemetry.
Use consistent connection terminology across the telemetry.
Do not introduce a new visual pattern for the telemetry if an existing pattern already solves the same problem.
Prefer composition over component nesting in the telemetry.
Keep the visual surface of the telemetry calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary telemetry information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the telemetry.
Use the reference HMI's instrument-panel logic as inspiration for the telemetry.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the telemetry feel native to Rideclub's spatial operating-system concept.
The final telemetry must not look like a generic admin dashboard.
The final telemetry must not look like a generic fintech dashboard.
The final telemetry must not look like a generic social feed.
The final telemetry must not look like a generic navigation clone.
The final telemetry must feel like one cohesive Rideclub cockpit.
# 58 — SPEED
Define the speed as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the speed benefits from geographic awareness.
Use a restrained near-black foundation behind the speed.
Use #F4F7FA for primary readable values in the speed.
Use #AAB1BD for supporting labels in the speed.
Use #66707D for low-priority metadata in the speed.
Use #FF4D21 only for Rideclub-primary actions in the speed.
Use cyan for live communication state when applicable to the speed.
Use green for successful or healthy state when applicable to the speed.
Use amber for caution state when applicable to the speed.
Use red only for critical state when applicable to the speed.
Use technical typography for telemetry values associated with the speed.
Use human-readable typography for rider-facing copy associated with the speed.
Avoid unnecessary rounded rectangles in the speed.
Avoid placing every datum inside its own container in the speed.
Use one-pixel structural rules when the speed needs visual grouping.
Use negative space as the first grouping mechanism in the speed.
Use radial geometry when the speed represents a measurable quantity.
Use nodes when the speed represents people or geographic entities.
Use lines when the speed represents a relationship or sequence.
Use rings when the speed represents progress, cohesion, or capacity.
Use large numerals when the speed contains a primary metric.
Use compact labels when the speed contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive speed controls.
Provide a larger sixty-four-pixel interaction zone for the most important speed action during riding.
Do not require precise tapping for critical speed actions.
Use hold-to-confirm for irreversible or safety-sensitive speed actions where appropriate.
Provide immediate visual feedback for every interactive speed action.
Animate the speed only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the speed.
Use sixty-to-two-hundred-fifty millisecond transitions for normal speed UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the speed.
Use opacity changes to establish secondary hierarchy in the speed.
Use scale changes sparingly in the speed.
Avoid large bounce animations in the speed.
Use subtle glow to indicate active state in the speed.
Never use glow as the only indicator of an important speed state.
Pair important speed states with text, iconography, or geometry.
Preserve the visual hierarchy of the speed under reduced-motion settings.
Ensure the speed remains understandable without animation.
Ensure the speed remains usable at high text zoom.
Ensure the speed remains usable in strong outdoor light where possible.
Use high contrast between the speed primary value and its background.
Do not use tiny gray text for essential speed information.
Keep secondary speed information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the speed.
Use uppercase tracking only for short telemetry labels in the speed.
Use tabular numerals for changing speed values.
Keep decimal precision consistent across the speed.
Use locale-aware formatting for distance and speed in the speed.
Use metric units by default for the speed when the user is in a metric locale.
Allow unit preferences to be changed in settings for the speed.
Use safe-area insets around the speed on mobile devices.
Keep important speed content away from gesture navigation edges.
Support landscape orientation for riding-focused speed screens.
Support portrait orientation for planning-focused speed screens.
Allow the speed to reorganize rather than simply shrink at smaller widths.
Do not stack every speed element vertically on mobile.
Use edge rails for compact speed telemetry on narrow screens.
Use bottom sheets only when the speed needs temporary detailed interaction.
Avoid permanent bottom sheets for the speed unless the screen is specifically designed around one.
Keep map gestures available whenever the speed does not require modal focus.
Prevent accidental map gestures while interacting with critical speed controls.
Use pointer-events layering intentionally for the speed.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the speed.
Use MapLibre layers for geographic information whenever possible for the speed.
Use DOM overlays only for interaction-heavy speed controls.
Keep route geometry visually dominant over secondary map labels in the speed.
Dim irrelevant map detail behind active speed guidance.
Use a clear active route line for the speed.
Use a thinner inactive route line for alternate speed paths.
Use checkpoint nodes to divide long speed journeys into understandable segments.
Use start and destination markers consistently in the speed.
Use directional orientation for moving rider markers in the speed.
Avoid using generic pins for every speed object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the speed.
Use clustering when many speed entities overlap.
Use expansion behavior when a speed cluster is selected.
Use proximity to determine emphasis for nearby speed entities.
Use distance labels only when distance is actionable for the speed.
Use live state indicators for connected speed entities.
Use stale-state indicators when speed data has not updated recently.
Never imply live speed data when the network is offline.
Clearly communicate offline state within the speed.
Use cached data gracefully for the speed.
Design the speed to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the speed.
Show network state without turning the speed into a diagnostic screen.
Keep system diagnostics secondary to the speed user goal.
Use haptic-ready interaction semantics for the speed where supported.
Use sound-ready states for the speed where auditory feedback is useful.
Do not make sound the only indication of a critical speed state.
Use clear visual acknowledgment after the speed receives an action.
Use optimistic feedback only when the speed action can safely be reversed.
Use progress indicators for long-running speed operations.
Use skeletons only when they help preserve the speed layout.
Avoid generic spinner-only loading states for major speed screens.
Provide purposeful empty states for the speed.
Provide recovery actions for speed errors.
Keep error messages concise and actionable in the speed.
Use a technical but human tone for speed system messages.
Never use jargon that the rider cannot understand in the speed.
Keep safety-critical copy direct and unambiguous in the speed.
Validate the speed at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the speed at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the speed in both portrait and landscape layouts.
Validate the speed with long rider names.
Validate the speed with long route names.
Validate the speed with zero riders.
Validate the speed with one rider.
Validate the speed with a full group.
Validate the speed with slow network conditions.
Validate the speed with no network.
Validate the speed with poor GPS accuracy.
Validate the speed with rapidly changing telemetry.
Validate the speed with accessibility text scaling.
Validate the speed with reduced motion.
Validate the speed with keyboard navigation where applicable.
Validate the speed with screen readers for non-driving planning contexts.
Validate the speed with touch and pointer input.
Validate the speed with glove-friendly target sizing.
Document every interactive state of the speed.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the speed.
Create a reusable component contract for the speed.
Keep component APIs semantic rather than visual-only for the speed.
Separate data state from presentation state in the speed.
Keep animation state separate from business state in the speed.
Avoid hardcoding user-specific values into the speed.
Drive speed values from the application's data layer.
Keep the speed resilient to missing optional data.
Keep the speed deterministic during replay or ride-history inspection.
Use consistent time formatting across the speed.
Use consistent distance formatting across the speed.
Use consistent rider status terminology across the speed.
Use consistent alert severity terminology across the speed.
Use consistent route terminology across the speed.
Use consistent checkpoint terminology across the speed.
Use consistent connection terminology across the speed.
Do not introduce a new visual pattern for the speed if an existing pattern already solves the same problem.
Prefer composition over component nesting in the speed.
Keep the visual surface of the speed calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary speed information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the speed.
Use the reference HMI's instrument-panel logic as inspiration for the speed.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the speed feel native to Rideclub's spatial operating-system concept.
The final speed must not look like a generic admin dashboard.
The final speed must not look like a generic fintech dashboard.
The final speed must not look like a generic social feed.
The final speed must not look like a generic navigation clone.
The final speed must feel like one cohesive Rideclub cockpit.
# 59 — DISTANCE
Define the distance as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the distance benefits from geographic awareness.
Use a restrained near-black foundation behind the distance.
Use #F4F7FA for primary readable values in the distance.
Use #AAB1BD for supporting labels in the distance.
Use #66707D for low-priority metadata in the distance.
Use #FF4D21 only for Rideclub-primary actions in the distance.
Use cyan for live communication state when applicable to the distance.
Use green for successful or healthy state when applicable to the distance.
Use amber for caution state when applicable to the distance.
Use red only for critical state when applicable to the distance.
Use technical typography for telemetry values associated with the distance.
Use human-readable typography for rider-facing copy associated with the distance.
Avoid unnecessary rounded rectangles in the distance.
Avoid placing every datum inside its own container in the distance.
Use one-pixel structural rules when the distance needs visual grouping.
Use negative space as the first grouping mechanism in the distance.
Use radial geometry when the distance represents a measurable quantity.
Use nodes when the distance represents people or geographic entities.
Use lines when the distance represents a relationship or sequence.
Use rings when the distance represents progress, cohesion, or capacity.
Use large numerals when the distance contains a primary metric.
Use compact labels when the distance contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive distance controls.
Provide a larger sixty-four-pixel interaction zone for the most important distance action during riding.
Do not require precise tapping for critical distance actions.
Use hold-to-confirm for irreversible or safety-sensitive distance actions where appropriate.
Provide immediate visual feedback for every interactive distance action.
Animate the distance only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the distance.
Use sixty-to-two-hundred-fifty millisecond transitions for normal distance UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the distance.
Use opacity changes to establish secondary hierarchy in the distance.
Use scale changes sparingly in the distance.
Avoid large bounce animations in the distance.
Use subtle glow to indicate active state in the distance.
Never use glow as the only indicator of an important distance state.
Pair important distance states with text, iconography, or geometry.
Preserve the visual hierarchy of the distance under reduced-motion settings.
Ensure the distance remains understandable without animation.
Ensure the distance remains usable at high text zoom.
Ensure the distance remains usable in strong outdoor light where possible.
Use high contrast between the distance primary value and its background.
Do not use tiny gray text for essential distance information.
Keep secondary distance information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the distance.
Use uppercase tracking only for short telemetry labels in the distance.
Use tabular numerals for changing distance values.
Keep decimal precision consistent across the distance.
Use locale-aware formatting for distance and speed in the distance.
Use metric units by default for the distance when the user is in a metric locale.
Allow unit preferences to be changed in settings for the distance.
Use safe-area insets around the distance on mobile devices.
Keep important distance content away from gesture navigation edges.
Support landscape orientation for riding-focused distance screens.
Support portrait orientation for planning-focused distance screens.
Allow the distance to reorganize rather than simply shrink at smaller widths.
Do not stack every distance element vertically on mobile.
Use edge rails for compact distance telemetry on narrow screens.
Use bottom sheets only when the distance needs temporary detailed interaction.
Avoid permanent bottom sheets for the distance unless the screen is specifically designed around one.
Keep map gestures available whenever the distance does not require modal focus.
Prevent accidental map gestures while interacting with critical distance controls.
Use pointer-events layering intentionally for the distance.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the distance.
Use MapLibre layers for geographic information whenever possible for the distance.
Use DOM overlays only for interaction-heavy distance controls.
Keep route geometry visually dominant over secondary map labels in the distance.
Dim irrelevant map detail behind active distance guidance.
Use a clear active route line for the distance.
Use a thinner inactive route line for alternate distance paths.
Use checkpoint nodes to divide long distance journeys into understandable segments.
Use start and destination markers consistently in the distance.
Use directional orientation for moving rider markers in the distance.
Avoid using generic pins for every distance object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the distance.
Use clustering when many distance entities overlap.
Use expansion behavior when a distance cluster is selected.
Use proximity to determine emphasis for nearby distance entities.
Use distance labels only when distance is actionable for the distance.
Use live state indicators for connected distance entities.
Use stale-state indicators when distance data has not updated recently.
Never imply live distance data when the network is offline.
Clearly communicate offline state within the distance.
Use cached data gracefully for the distance.
Design the distance to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the distance.
Show network state without turning the distance into a diagnostic screen.
Keep system diagnostics secondary to the distance user goal.
Use haptic-ready interaction semantics for the distance where supported.
Use sound-ready states for the distance where auditory feedback is useful.
Do not make sound the only indication of a critical distance state.
Use clear visual acknowledgment after the distance receives an action.
Use optimistic feedback only when the distance action can safely be reversed.
Use progress indicators for long-running distance operations.
Use skeletons only when they help preserve the distance layout.
Avoid generic spinner-only loading states for major distance screens.
Provide purposeful empty states for the distance.
Provide recovery actions for distance errors.
Keep error messages concise and actionable in the distance.
Use a technical but human tone for distance system messages.
Never use jargon that the rider cannot understand in the distance.
Keep safety-critical copy direct and unambiguous in the distance.
Validate the distance at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the distance at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the distance in both portrait and landscape layouts.
Validate the distance with long rider names.
Validate the distance with long route names.
Validate the distance with zero riders.
Validate the distance with one rider.
Validate the distance with a full group.
Validate the distance with slow network conditions.
Validate the distance with no network.
Validate the distance with poor GPS accuracy.
Validate the distance with rapidly changing telemetry.
Validate the distance with accessibility text scaling.
Validate the distance with reduced motion.
Validate the distance with keyboard navigation where applicable.
Validate the distance with screen readers for non-driving planning contexts.
Validate the distance with touch and pointer input.
Validate the distance with glove-friendly target sizing.
Document every interactive state of the distance.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the distance.
Create a reusable component contract for the distance.
Keep component APIs semantic rather than visual-only for the distance.
Separate data state from presentation state in the distance.
Keep animation state separate from business state in the distance.
Avoid hardcoding user-specific values into the distance.
Drive distance values from the application's data layer.
Keep the distance resilient to missing optional data.
Keep the distance deterministic during replay or ride-history inspection.
Use consistent time formatting across the distance.
Use consistent distance formatting across the distance.
Use consistent rider status terminology across the distance.
Use consistent alert severity terminology across the distance.
Use consistent route terminology across the distance.
Use consistent checkpoint terminology across the distance.
Use consistent connection terminology across the distance.
Do not introduce a new visual pattern for the distance if an existing pattern already solves the same problem.
Prefer composition over component nesting in the distance.
Keep the visual surface of the distance calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary distance information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the distance.
Use the reference HMI's instrument-panel logic as inspiration for the distance.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the distance feel native to Rideclub's spatial operating-system concept.
The final distance must not look like a generic admin dashboard.
The final distance must not look like a generic fintech dashboard.
The final distance must not look like a generic social feed.
The final distance must not look like a generic navigation clone.
The final distance must feel like one cohesive Rideclub cockpit.
# 60 — ETA
Define the ETA as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the ETA benefits from geographic awareness.
Use a restrained near-black foundation behind the ETA.
Use #F4F7FA for primary readable values in the ETA.
Use #AAB1BD for supporting labels in the ETA.
Use #66707D for low-priority metadata in the ETA.
Use #FF4D21 only for Rideclub-primary actions in the ETA.
Use cyan for live communication state when applicable to the ETA.
Use green for successful or healthy state when applicable to the ETA.
Use amber for caution state when applicable to the ETA.
Use red only for critical state when applicable to the ETA.
Use technical typography for telemetry values associated with the ETA.
Use human-readable typography for rider-facing copy associated with the ETA.
Avoid unnecessary rounded rectangles in the ETA.
Avoid placing every datum inside its own container in the ETA.
Use one-pixel structural rules when the ETA needs visual grouping.
Use negative space as the first grouping mechanism in the ETA.
Use radial geometry when the ETA represents a measurable quantity.
Use nodes when the ETA represents people or geographic entities.
Use lines when the ETA represents a relationship or sequence.
Use rings when the ETA represents progress, cohesion, or capacity.
Use large numerals when the ETA contains a primary metric.
Use compact labels when the ETA contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive ETA controls.
Provide a larger sixty-four-pixel interaction zone for the most important ETA action during riding.
Do not require precise tapping for critical ETA actions.
Use hold-to-confirm for irreversible or safety-sensitive ETA actions where appropriate.
Provide immediate visual feedback for every interactive ETA action.
Animate the ETA only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the ETA.
Use sixty-to-two-hundred-fifty millisecond transitions for normal ETA UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the ETA.
Use opacity changes to establish secondary hierarchy in the ETA.
Use scale changes sparingly in the ETA.
Avoid large bounce animations in the ETA.
Use subtle glow to indicate active state in the ETA.
Never use glow as the only indicator of an important ETA state.
Pair important ETA states with text, iconography, or geometry.
Preserve the visual hierarchy of the ETA under reduced-motion settings.
Ensure the ETA remains understandable without animation.
Ensure the ETA remains usable at high text zoom.
Ensure the ETA remains usable in strong outdoor light where possible.
Use high contrast between the ETA primary value and its background.
Do not use tiny gray text for essential ETA information.
Keep secondary ETA information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the ETA.
Use uppercase tracking only for short telemetry labels in the ETA.
Use tabular numerals for changing ETA values.
Keep decimal precision consistent across the ETA.
Use locale-aware formatting for distance and speed in the ETA.
Use metric units by default for the ETA when the user is in a metric locale.
Allow unit preferences to be changed in settings for the ETA.
Use safe-area insets around the ETA on mobile devices.
Keep important ETA content away from gesture navigation edges.
Support landscape orientation for riding-focused ETA screens.
Support portrait orientation for planning-focused ETA screens.
Allow the ETA to reorganize rather than simply shrink at smaller widths.
Do not stack every ETA element vertically on mobile.
Use edge rails for compact ETA telemetry on narrow screens.
Use bottom sheets only when the ETA needs temporary detailed interaction.
Avoid permanent bottom sheets for the ETA unless the screen is specifically designed around one.
Keep map gestures available whenever the ETA does not require modal focus.
Prevent accidental map gestures while interacting with critical ETA controls.
Use pointer-events layering intentionally for the ETA.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the ETA.
Use MapLibre layers for geographic information whenever possible for the ETA.
Use DOM overlays only for interaction-heavy ETA controls.
Keep route geometry visually dominant over secondary map labels in the ETA.
Dim irrelevant map detail behind active ETA guidance.
Use a clear active route line for the ETA.
Use a thinner inactive route line for alternate ETA paths.
Use checkpoint nodes to divide long ETA journeys into understandable segments.
Use start and destination markers consistently in the ETA.
Use directional orientation for moving rider markers in the ETA.
Avoid using generic pins for every ETA object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the ETA.
Use clustering when many ETA entities overlap.
Use expansion behavior when a ETA cluster is selected.
Use proximity to determine emphasis for nearby ETA entities.
Use distance labels only when distance is actionable for the ETA.
Use live state indicators for connected ETA entities.
Use stale-state indicators when ETA data has not updated recently.
Never imply live ETA data when the network is offline.
Clearly communicate offline state within the ETA.
Use cached data gracefully for the ETA.
Design the ETA to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the ETA.
Show network state without turning the ETA into a diagnostic screen.
Keep system diagnostics secondary to the ETA user goal.
Use haptic-ready interaction semantics for the ETA where supported.
Use sound-ready states for the ETA where auditory feedback is useful.
Do not make sound the only indication of a critical ETA state.
Use clear visual acknowledgment after the ETA receives an action.
Use optimistic feedback only when the ETA action can safely be reversed.
Use progress indicators for long-running ETA operations.
Use skeletons only when they help preserve the ETA layout.
Avoid generic spinner-only loading states for major ETA screens.
Provide purposeful empty states for the ETA.
Provide recovery actions for ETA errors.
Keep error messages concise and actionable in the ETA.
Use a technical but human tone for ETA system messages.
Never use jargon that the rider cannot understand in the ETA.
Keep safety-critical copy direct and unambiguous in the ETA.
Validate the ETA at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the ETA at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the ETA in both portrait and landscape layouts.
Validate the ETA with long rider names.
Validate the ETA with long route names.
Validate the ETA with zero riders.
Validate the ETA with one rider.
Validate the ETA with a full group.
Validate the ETA with slow network conditions.
Validate the ETA with no network.
Validate the ETA with poor GPS accuracy.
Validate the ETA with rapidly changing telemetry.
Validate the ETA with accessibility text scaling.
Validate the ETA with reduced motion.
Validate the ETA with keyboard navigation where applicable.
Validate the ETA with screen readers for non-driving planning contexts.
Validate the ETA with touch and pointer input.
Validate the ETA with glove-friendly target sizing.
Document every interactive state of the ETA.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the ETA.
Create a reusable component contract for the ETA.
Keep component APIs semantic rather than visual-only for the ETA.
Separate data state from presentation state in the ETA.
Keep animation state separate from business state in the ETA.
Avoid hardcoding user-specific values into the ETA.
Drive ETA values from the application's data layer.
Keep the ETA resilient to missing optional data.
Keep the ETA deterministic during replay or ride-history inspection.
Use consistent time formatting across the ETA.
Use consistent distance formatting across the ETA.
Use consistent rider status terminology across the ETA.
Use consistent alert severity terminology across the ETA.
Use consistent route terminology across the ETA.
Use consistent checkpoint terminology across the ETA.
Use consistent connection terminology across the ETA.
Do not introduce a new visual pattern for the ETA if an existing pattern already solves the same problem.
Prefer composition over component nesting in the ETA.
Keep the visual surface of the ETA calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary ETA information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the ETA.
Use the reference HMI's instrument-panel logic as inspiration for the ETA.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the ETA feel native to Rideclub's spatial operating-system concept.
The final ETA must not look like a generic admin dashboard.
The final ETA must not look like a generic fintech dashboard.
The final ETA must not look like a generic social feed.
The final ETA must not look like a generic navigation clone.
The final ETA must feel like one cohesive Rideclub cockpit.
# 61 — ELEVATION
Define the elevation as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the elevation benefits from geographic awareness.
Use a restrained near-black foundation behind the elevation.
Use #F4F7FA for primary readable values in the elevation.
Use #AAB1BD for supporting labels in the elevation.
Use #66707D for low-priority metadata in the elevation.
Use #FF4D21 only for Rideclub-primary actions in the elevation.
Use cyan for live communication state when applicable to the elevation.
Use green for successful or healthy state when applicable to the elevation.
Use amber for caution state when applicable to the elevation.
Use red only for critical state when applicable to the elevation.
Use technical typography for telemetry values associated with the elevation.
Use human-readable typography for rider-facing copy associated with the elevation.
Avoid unnecessary rounded rectangles in the elevation.
Avoid placing every datum inside its own container in the elevation.
Use one-pixel structural rules when the elevation needs visual grouping.
Use negative space as the first grouping mechanism in the elevation.
Use radial geometry when the elevation represents a measurable quantity.
Use nodes when the elevation represents people or geographic entities.
Use lines when the elevation represents a relationship or sequence.
Use rings when the elevation represents progress, cohesion, or capacity.
Use large numerals when the elevation contains a primary metric.
Use compact labels when the elevation contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive elevation controls.
Provide a larger sixty-four-pixel interaction zone for the most important elevation action during riding.
Do not require precise tapping for critical elevation actions.
Use hold-to-confirm for irreversible or safety-sensitive elevation actions where appropriate.
Provide immediate visual feedback for every interactive elevation action.
Animate the elevation only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the elevation.
Use sixty-to-two-hundred-fifty millisecond transitions for normal elevation UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the elevation.
Use opacity changes to establish secondary hierarchy in the elevation.
Use scale changes sparingly in the elevation.
Avoid large bounce animations in the elevation.
Use subtle glow to indicate active state in the elevation.
Never use glow as the only indicator of an important elevation state.
Pair important elevation states with text, iconography, or geometry.
Preserve the visual hierarchy of the elevation under reduced-motion settings.
Ensure the elevation remains understandable without animation.
Ensure the elevation remains usable at high text zoom.
Ensure the elevation remains usable in strong outdoor light where possible.
Use high contrast between the elevation primary value and its background.
Do not use tiny gray text for essential elevation information.
Keep secondary elevation information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the elevation.
Use uppercase tracking only for short telemetry labels in the elevation.
Use tabular numerals for changing elevation values.
Keep decimal precision consistent across the elevation.
Use locale-aware formatting for distance and speed in the elevation.
Use metric units by default for the elevation when the user is in a metric locale.
Allow unit preferences to be changed in settings for the elevation.
Use safe-area insets around the elevation on mobile devices.
Keep important elevation content away from gesture navigation edges.
Support landscape orientation for riding-focused elevation screens.
Support portrait orientation for planning-focused elevation screens.
Allow the elevation to reorganize rather than simply shrink at smaller widths.
Do not stack every elevation element vertically on mobile.
Use edge rails for compact elevation telemetry on narrow screens.
Use bottom sheets only when the elevation needs temporary detailed interaction.
Avoid permanent bottom sheets for the elevation unless the screen is specifically designed around one.
Keep map gestures available whenever the elevation does not require modal focus.
Prevent accidental map gestures while interacting with critical elevation controls.
Use pointer-events layering intentionally for the elevation.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the elevation.
Use MapLibre layers for geographic information whenever possible for the elevation.
Use DOM overlays only for interaction-heavy elevation controls.
Keep route geometry visually dominant over secondary map labels in the elevation.
Dim irrelevant map detail behind active elevation guidance.
Use a clear active route line for the elevation.
Use a thinner inactive route line for alternate elevation paths.
Use checkpoint nodes to divide long elevation journeys into understandable segments.
Use start and destination markers consistently in the elevation.
Use directional orientation for moving rider markers in the elevation.
Avoid using generic pins for every elevation object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the elevation.
Use clustering when many elevation entities overlap.
Use expansion behavior when a elevation cluster is selected.
Use proximity to determine emphasis for nearby elevation entities.
Use distance labels only when distance is actionable for the elevation.
Use live state indicators for connected elevation entities.
Use stale-state indicators when elevation data has not updated recently.
Never imply live elevation data when the network is offline.
Clearly communicate offline state within the elevation.
Use cached data gracefully for the elevation.
Design the elevation to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the elevation.
Show network state without turning the elevation into a diagnostic screen.
Keep system diagnostics secondary to the elevation user goal.
Use haptic-ready interaction semantics for the elevation where supported.
Use sound-ready states for the elevation where auditory feedback is useful.
Do not make sound the only indication of a critical elevation state.
Use clear visual acknowledgment after the elevation receives an action.
Use optimistic feedback only when the elevation action can safely be reversed.
Use progress indicators for long-running elevation operations.
Use skeletons only when they help preserve the elevation layout.
Avoid generic spinner-only loading states for major elevation screens.
Provide purposeful empty states for the elevation.
Provide recovery actions for elevation errors.
Keep error messages concise and actionable in the elevation.
Use a technical but human tone for elevation system messages.
Never use jargon that the rider cannot understand in the elevation.
Keep safety-critical copy direct and unambiguous in the elevation.
Validate the elevation at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the elevation at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the elevation in both portrait and landscape layouts.
Validate the elevation with long rider names.
Validate the elevation with long route names.
Validate the elevation with zero riders.
Validate the elevation with one rider.
Validate the elevation with a full group.
Validate the elevation with slow network conditions.
Validate the elevation with no network.
Validate the elevation with poor GPS accuracy.
Validate the elevation with rapidly changing telemetry.
Validate the elevation with accessibility text scaling.
Validate the elevation with reduced motion.
Validate the elevation with keyboard navigation where applicable.
Validate the elevation with screen readers for non-driving planning contexts.
Validate the elevation with touch and pointer input.
Validate the elevation with glove-friendly target sizing.
Document every interactive state of the elevation.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the elevation.
Create a reusable component contract for the elevation.
Keep component APIs semantic rather than visual-only for the elevation.
Separate data state from presentation state in the elevation.
Keep animation state separate from business state in the elevation.
Avoid hardcoding user-specific values into the elevation.
Drive elevation values from the application's data layer.
Keep the elevation resilient to missing optional data.
Keep the elevation deterministic during replay or ride-history inspection.
Use consistent time formatting across the elevation.
Use consistent distance formatting across the elevation.
Use consistent rider status terminology across the elevation.
Use consistent alert severity terminology across the elevation.
Use consistent route terminology across the elevation.
Use consistent checkpoint terminology across the elevation.
Use consistent connection terminology across the elevation.
Do not introduce a new visual pattern for the elevation if an existing pattern already solves the same problem.
Prefer composition over component nesting in the elevation.
Keep the visual surface of the elevation calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary elevation information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the elevation.
Use the reference HMI's instrument-panel logic as inspiration for the elevation.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the elevation feel native to Rideclub's spatial operating-system concept.
The final elevation must not look like a generic admin dashboard.
The final elevation must not look like a generic fintech dashboard.
The final elevation must not look like a generic social feed.
The final elevation must not look like a generic navigation clone.
The final elevation must feel like one cohesive Rideclub cockpit.
# 62 — STOP ANALYSIS
Define the stops as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the stops benefits from geographic awareness.
Use a restrained near-black foundation behind the stops.
Use #F4F7FA for primary readable values in the stops.
Use #AAB1BD for supporting labels in the stops.
Use #66707D for low-priority metadata in the stops.
Use #FF4D21 only for Rideclub-primary actions in the stops.
Use cyan for live communication state when applicable to the stops.
Use green for successful or healthy state when applicable to the stops.
Use amber for caution state when applicable to the stops.
Use red only for critical state when applicable to the stops.
Use technical typography for telemetry values associated with the stops.
Use human-readable typography for rider-facing copy associated with the stops.
Avoid unnecessary rounded rectangles in the stops.
Avoid placing every datum inside its own container in the stops.
Use one-pixel structural rules when the stops needs visual grouping.
Use negative space as the first grouping mechanism in the stops.
Use radial geometry when the stops represents a measurable quantity.
Use nodes when the stops represents people or geographic entities.
Use lines when the stops represents a relationship or sequence.
Use rings when the stops represents progress, cohesion, or capacity.
Use large numerals when the stops contains a primary metric.
Use compact labels when the stops contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive stops controls.
Provide a larger sixty-four-pixel interaction zone for the most important stops action during riding.
Do not require precise tapping for critical stops actions.
Use hold-to-confirm for irreversible or safety-sensitive stops actions where appropriate.
Provide immediate visual feedback for every interactive stops action.
Animate the stops only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the stops.
Use sixty-to-two-hundred-fifty millisecond transitions for normal stops UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the stops.
Use opacity changes to establish secondary hierarchy in the stops.
Use scale changes sparingly in the stops.
Avoid large bounce animations in the stops.
Use subtle glow to indicate active state in the stops.
Never use glow as the only indicator of an important stops state.
Pair important stops states with text, iconography, or geometry.
Preserve the visual hierarchy of the stops under reduced-motion settings.
Ensure the stops remains understandable without animation.
Ensure the stops remains usable at high text zoom.
Ensure the stops remains usable in strong outdoor light where possible.
Use high contrast between the stops primary value and its background.
Do not use tiny gray text for essential stops information.
Keep secondary stops information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the stops.
Use uppercase tracking only for short telemetry labels in the stops.
Use tabular numerals for changing stops values.
Keep decimal precision consistent across the stops.
Use locale-aware formatting for distance and speed in the stops.
Use metric units by default for the stops when the user is in a metric locale.
Allow unit preferences to be changed in settings for the stops.
Use safe-area insets around the stops on mobile devices.
Keep important stops content away from gesture navigation edges.
Support landscape orientation for riding-focused stops screens.
Support portrait orientation for planning-focused stops screens.
Allow the stops to reorganize rather than simply shrink at smaller widths.
Do not stack every stops element vertically on mobile.
Use edge rails for compact stops telemetry on narrow screens.
Use bottom sheets only when the stops needs temporary detailed interaction.
Avoid permanent bottom sheets for the stops unless the screen is specifically designed around one.
Keep map gestures available whenever the stops does not require modal focus.
Prevent accidental map gestures while interacting with critical stops controls.
Use pointer-events layering intentionally for the stops.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the stops.
Use MapLibre layers for geographic information whenever possible for the stops.
Use DOM overlays only for interaction-heavy stops controls.
Keep route geometry visually dominant over secondary map labels in the stops.
Dim irrelevant map detail behind active stops guidance.
Use a clear active route line for the stops.
Use a thinner inactive route line for alternate stops paths.
Use checkpoint nodes to divide long stops journeys into understandable segments.
Use start and destination markers consistently in the stops.
Use directional orientation for moving rider markers in the stops.
Avoid using generic pins for every stops object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the stops.
Use clustering when many stops entities overlap.
Use expansion behavior when a stops cluster is selected.
Use proximity to determine emphasis for nearby stops entities.
Use distance labels only when distance is actionable for the stops.
Use live state indicators for connected stops entities.
Use stale-state indicators when stops data has not updated recently.
Never imply live stops data when the network is offline.
Clearly communicate offline state within the stops.
Use cached data gracefully for the stops.
Design the stops to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the stops.
Show network state without turning the stops into a diagnostic screen.
Keep system diagnostics secondary to the stops user goal.
Use haptic-ready interaction semantics for the stops where supported.
Use sound-ready states for the stops where auditory feedback is useful.
Do not make sound the only indication of a critical stops state.
Use clear visual acknowledgment after the stops receives an action.
Use optimistic feedback only when the stops action can safely be reversed.
Use progress indicators for long-running stops operations.
Use skeletons only when they help preserve the stops layout.
Avoid generic spinner-only loading states for major stops screens.
Provide purposeful empty states for the stops.
Provide recovery actions for stops errors.
Keep error messages concise and actionable in the stops.
Use a technical but human tone for stops system messages.
Never use jargon that the rider cannot understand in the stops.
Keep safety-critical copy direct and unambiguous in the stops.
Validate the stops at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the stops at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the stops in both portrait and landscape layouts.
Validate the stops with long rider names.
Validate the stops with long route names.
Validate the stops with zero riders.
Validate the stops with one rider.
Validate the stops with a full group.
Validate the stops with slow network conditions.
Validate the stops with no network.
Validate the stops with poor GPS accuracy.
Validate the stops with rapidly changing telemetry.
Validate the stops with accessibility text scaling.
Validate the stops with reduced motion.
Validate the stops with keyboard navigation where applicable.
Validate the stops with screen readers for non-driving planning contexts.
Validate the stops with touch and pointer input.
Validate the stops with glove-friendly target sizing.
Document every interactive state of the stops.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the stops.
Create a reusable component contract for the stops.
Keep component APIs semantic rather than visual-only for the stops.
Separate data state from presentation state in the stops.
Keep animation state separate from business state in the stops.
Avoid hardcoding user-specific values into the stops.
Drive stops values from the application's data layer.
Keep the stops resilient to missing optional data.
Keep the stops deterministic during replay or ride-history inspection.
Use consistent time formatting across the stops.
Use consistent distance formatting across the stops.
Use consistent rider status terminology across the stops.
Use consistent alert severity terminology across the stops.
Use consistent route terminology across the stops.
Use consistent checkpoint terminology across the stops.
Use consistent connection terminology across the stops.
Do not introduce a new visual pattern for the stops if an existing pattern already solves the same problem.
Prefer composition over component nesting in the stops.
Keep the visual surface of the stops calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary stops information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the stops.
Use the reference HMI's instrument-panel logic as inspiration for the stops.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the stops feel native to Rideclub's spatial operating-system concept.
The final stops must not look like a generic admin dashboard.
The final stops must not look like a generic fintech dashboard.
The final stops must not look like a generic social feed.
The final stops must not look like a generic navigation clone.
The final stops must feel like one cohesive Rideclub cockpit.
# 63 — ROUTE PROGRESS
Define the progress as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the progress benefits from geographic awareness.
Use a restrained near-black foundation behind the progress.
Use #F4F7FA for primary readable values in the progress.
Use #AAB1BD for supporting labels in the progress.
Use #66707D for low-priority metadata in the progress.
Use #FF4D21 only for Rideclub-primary actions in the progress.
Use cyan for live communication state when applicable to the progress.
Use green for successful or healthy state when applicable to the progress.
Use amber for caution state when applicable to the progress.
Use red only for critical state when applicable to the progress.
Use technical typography for telemetry values associated with the progress.
Use human-readable typography for rider-facing copy associated with the progress.
Avoid unnecessary rounded rectangles in the progress.
Avoid placing every datum inside its own container in the progress.
Use one-pixel structural rules when the progress needs visual grouping.
Use negative space as the first grouping mechanism in the progress.
Use radial geometry when the progress represents a measurable quantity.
Use nodes when the progress represents people or geographic entities.
Use lines when the progress represents a relationship or sequence.
Use rings when the progress represents progress, cohesion, or capacity.
Use large numerals when the progress contains a primary metric.
Use compact labels when the progress contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive progress controls.
Provide a larger sixty-four-pixel interaction zone for the most important progress action during riding.
Do not require precise tapping for critical progress actions.
Use hold-to-confirm for irreversible or safety-sensitive progress actions where appropriate.
Provide immediate visual feedback for every interactive progress action.
Animate the progress only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the progress.
Use sixty-to-two-hundred-fifty millisecond transitions for normal progress UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the progress.
Use opacity changes to establish secondary hierarchy in the progress.
Use scale changes sparingly in the progress.
Avoid large bounce animations in the progress.
Use subtle glow to indicate active state in the progress.
Never use glow as the only indicator of an important progress state.
Pair important progress states with text, iconography, or geometry.
Preserve the visual hierarchy of the progress under reduced-motion settings.
Ensure the progress remains understandable without animation.
Ensure the progress remains usable at high text zoom.
Ensure the progress remains usable in strong outdoor light where possible.
Use high contrast between the progress primary value and its background.
Do not use tiny gray text for essential progress information.
Keep secondary progress information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the progress.
Use uppercase tracking only for short telemetry labels in the progress.
Use tabular numerals for changing progress values.
Keep decimal precision consistent across the progress.
Use locale-aware formatting for distance and speed in the progress.
Use metric units by default for the progress when the user is in a metric locale.
Allow unit preferences to be changed in settings for the progress.
Use safe-area insets around the progress on mobile devices.
Keep important progress content away from gesture navigation edges.
Support landscape orientation for riding-focused progress screens.
Support portrait orientation for planning-focused progress screens.
Allow the progress to reorganize rather than simply shrink at smaller widths.
Do not stack every progress element vertically on mobile.
Use edge rails for compact progress telemetry on narrow screens.
Use bottom sheets only when the progress needs temporary detailed interaction.
Avoid permanent bottom sheets for the progress unless the screen is specifically designed around one.
Keep map gestures available whenever the progress does not require modal focus.
Prevent accidental map gestures while interacting with critical progress controls.
Use pointer-events layering intentionally for the progress.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the progress.
Use MapLibre layers for geographic information whenever possible for the progress.
Use DOM overlays only for interaction-heavy progress controls.
Keep route geometry visually dominant over secondary map labels in the progress.
Dim irrelevant map detail behind active progress guidance.
Use a clear active route line for the progress.
Use a thinner inactive route line for alternate progress paths.
Use checkpoint nodes to divide long progress journeys into understandable segments.
Use start and destination markers consistently in the progress.
Use directional orientation for moving rider markers in the progress.
Avoid using generic pins for every progress object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the progress.
Use clustering when many progress entities overlap.
Use expansion behavior when a progress cluster is selected.
Use proximity to determine emphasis for nearby progress entities.
Use distance labels only when distance is actionable for the progress.
Use live state indicators for connected progress entities.
Use stale-state indicators when progress data has not updated recently.
Never imply live progress data when the network is offline.
Clearly communicate offline state within the progress.
Use cached data gracefully for the progress.
Design the progress to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the progress.
Show network state without turning the progress into a diagnostic screen.
Keep system diagnostics secondary to the progress user goal.
Use haptic-ready interaction semantics for the progress where supported.
Use sound-ready states for the progress where auditory feedback is useful.
Do not make sound the only indication of a critical progress state.
Use clear visual acknowledgment after the progress receives an action.
Use optimistic feedback only when the progress action can safely be reversed.
Use progress indicators for long-running progress operations.
Use skeletons only when they help preserve the progress layout.
Avoid generic spinner-only loading states for major progress screens.
Provide purposeful empty states for the progress.
Provide recovery actions for progress errors.
Keep error messages concise and actionable in the progress.
Use a technical but human tone for progress system messages.
Never use jargon that the rider cannot understand in the progress.
Keep safety-critical copy direct and unambiguous in the progress.
Validate the progress at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the progress at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the progress in both portrait and landscape layouts.
Validate the progress with long rider names.
Validate the progress with long route names.
Validate the progress with zero riders.
Validate the progress with one rider.
Validate the progress with a full group.
Validate the progress with slow network conditions.
Validate the progress with no network.
Validate the progress with poor GPS accuracy.
Validate the progress with rapidly changing telemetry.
Validate the progress with accessibility text scaling.
Validate the progress with reduced motion.
Validate the progress with keyboard navigation where applicable.
Validate the progress with screen readers for non-driving planning contexts.
Validate the progress with touch and pointer input.
Validate the progress with glove-friendly target sizing.
Document every interactive state of the progress.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the progress.
Create a reusable component contract for the progress.
Keep component APIs semantic rather than visual-only for the progress.
Separate data state from presentation state in the progress.
Keep animation state separate from business state in the progress.
Avoid hardcoding user-specific values into the progress.
Drive progress values from the application's data layer.
Keep the progress resilient to missing optional data.
Keep the progress deterministic during replay or ride-history inspection.
Use consistent time formatting across the progress.
Use consistent distance formatting across the progress.
Use consistent rider status terminology across the progress.
Use consistent alert severity terminology across the progress.
Use consistent route terminology across the progress.
Use consistent checkpoint terminology across the progress.
Use consistent connection terminology across the progress.
Do not introduce a new visual pattern for the progress if an existing pattern already solves the same problem.
Prefer composition over component nesting in the progress.
Keep the visual surface of the progress calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary progress information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the progress.
Use the reference HMI's instrument-panel logic as inspiration for the progress.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the progress feel native to Rideclub's spatial operating-system concept.
The final progress must not look like a generic admin dashboard.
The final progress must not look like a generic fintech dashboard.
The final progress must not look like a generic social feed.
The final progress must not look like a generic navigation clone.
The final progress must feel like one cohesive Rideclub cockpit.
# 64 — COMMAND DOCK
Define the command dock as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the command dock benefits from geographic awareness.
Use a restrained near-black foundation behind the command dock.
Use #F4F7FA for primary readable values in the command dock.
Use #AAB1BD for supporting labels in the command dock.
Use #66707D for low-priority metadata in the command dock.
Use #FF4D21 only for Rideclub-primary actions in the command dock.
Use cyan for live communication state when applicable to the command dock.
Use green for successful or healthy state when applicable to the command dock.
Use amber for caution state when applicable to the command dock.
Use red only for critical state when applicable to the command dock.
Use technical typography for telemetry values associated with the command dock.
Use human-readable typography for rider-facing copy associated with the command dock.
Avoid unnecessary rounded rectangles in the command dock.
Avoid placing every datum inside its own container in the command dock.
Use one-pixel structural rules when the command dock needs visual grouping.
Use negative space as the first grouping mechanism in the command dock.
Use radial geometry when the command dock represents a measurable quantity.
Use nodes when the command dock represents people or geographic entities.
Use lines when the command dock represents a relationship or sequence.
Use rings when the command dock represents progress, cohesion, or capacity.
Use large numerals when the command dock contains a primary metric.
Use compact labels when the command dock contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive command dock controls.
Provide a larger sixty-four-pixel interaction zone for the most important command dock action during riding.
Do not require precise tapping for critical command dock actions.
Use hold-to-confirm for irreversible or safety-sensitive command dock actions where appropriate.
Provide immediate visual feedback for every interactive command dock action.
Animate the command dock only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the command dock.
Use sixty-to-two-hundred-fifty millisecond transitions for normal command dock UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the command dock.
Use opacity changes to establish secondary hierarchy in the command dock.
Use scale changes sparingly in the command dock.
Avoid large bounce animations in the command dock.
Use subtle glow to indicate active state in the command dock.
Never use glow as the only indicator of an important command dock state.
Pair important command dock states with text, iconography, or geometry.
Preserve the visual hierarchy of the command dock under reduced-motion settings.
Ensure the command dock remains understandable without animation.
Ensure the command dock remains usable at high text zoom.
Ensure the command dock remains usable in strong outdoor light where possible.
Use high contrast between the command dock primary value and its background.
Do not use tiny gray text for essential command dock information.
Keep secondary command dock information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the command dock.
Use uppercase tracking only for short telemetry labels in the command dock.
Use tabular numerals for changing command dock values.
Keep decimal precision consistent across the command dock.
Use locale-aware formatting for distance and speed in the command dock.
Use metric units by default for the command dock when the user is in a metric locale.
Allow unit preferences to be changed in settings for the command dock.
Use safe-area insets around the command dock on mobile devices.
Keep important command dock content away from gesture navigation edges.
Support landscape orientation for riding-focused command dock screens.
Support portrait orientation for planning-focused command dock screens.
Allow the command dock to reorganize rather than simply shrink at smaller widths.
Do not stack every command dock element vertically on mobile.
Use edge rails for compact command dock telemetry on narrow screens.
Use bottom sheets only when the command dock needs temporary detailed interaction.
Avoid permanent bottom sheets for the command dock unless the screen is specifically designed around one.
Keep map gestures available whenever the command dock does not require modal focus.
Prevent accidental map gestures while interacting with critical command dock controls.
Use pointer-events layering intentionally for the command dock.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the command dock.
Use MapLibre layers for geographic information whenever possible for the command dock.
Use DOM overlays only for interaction-heavy command dock controls.
Keep route geometry visually dominant over secondary map labels in the command dock.
Dim irrelevant map detail behind active command dock guidance.
Use a clear active route line for the command dock.
Use a thinner inactive route line for alternate command dock paths.
Use checkpoint nodes to divide long command dock journeys into understandable segments.
Use start and destination markers consistently in the command dock.
Use directional orientation for moving rider markers in the command dock.
Avoid using generic pins for every command dock object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the command dock.
Use clustering when many command dock entities overlap.
Use expansion behavior when a command dock cluster is selected.
Use proximity to determine emphasis for nearby command dock entities.
Use distance labels only when distance is actionable for the command dock.
Use live state indicators for connected command dock entities.
Use stale-state indicators when command dock data has not updated recently.
Never imply live command dock data when the network is offline.
Clearly communicate offline state within the command dock.
Use cached data gracefully for the command dock.
Design the command dock to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the command dock.
Show network state without turning the command dock into a diagnostic screen.
Keep system diagnostics secondary to the command dock user goal.
Use haptic-ready interaction semantics for the command dock where supported.
Use sound-ready states for the command dock where auditory feedback is useful.
Do not make sound the only indication of a critical command dock state.
Use clear visual acknowledgment after the command dock receives an action.
Use optimistic feedback only when the command dock action can safely be reversed.
Use progress indicators for long-running command dock operations.
Use skeletons only when they help preserve the command dock layout.
Avoid generic spinner-only loading states for major command dock screens.
Provide purposeful empty states for the command dock.
Provide recovery actions for command dock errors.
Keep error messages concise and actionable in the command dock.
Use a technical but human tone for command dock system messages.
Never use jargon that the rider cannot understand in the command dock.
Keep safety-critical copy direct and unambiguous in the command dock.
Validate the command dock at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the command dock at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the command dock in both portrait and landscape layouts.
Validate the command dock with long rider names.
Validate the command dock with long route names.
Validate the command dock with zero riders.
Validate the command dock with one rider.
Validate the command dock with a full group.
Validate the command dock with slow network conditions.
Validate the command dock with no network.
Validate the command dock with poor GPS accuracy.
Validate the command dock with rapidly changing telemetry.
Validate the command dock with accessibility text scaling.
Validate the command dock with reduced motion.
Validate the command dock with keyboard navigation where applicable.
Validate the command dock with screen readers for non-driving planning contexts.
Validate the command dock with touch and pointer input.
Validate the command dock with glove-friendly target sizing.
Document every interactive state of the command dock.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the command dock.
Create a reusable component contract for the command dock.
Keep component APIs semantic rather than visual-only for the command dock.
Separate data state from presentation state in the command dock.
Keep animation state separate from business state in the command dock.
Avoid hardcoding user-specific values into the command dock.
Drive command dock values from the application's data layer.
Keep the command dock resilient to missing optional data.
Keep the command dock deterministic during replay or ride-history inspection.
Use consistent time formatting across the command dock.
Use consistent distance formatting across the command dock.
Use consistent rider status terminology across the command dock.
Use consistent alert severity terminology across the command dock.
Use consistent route terminology across the command dock.
Use consistent checkpoint terminology across the command dock.
Use consistent connection terminology across the command dock.
Do not introduce a new visual pattern for the command dock if an existing pattern already solves the same problem.
Prefer composition over component nesting in the command dock.
Keep the visual surface of the command dock calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary command dock information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the command dock.
Use the reference HMI's instrument-panel logic as inspiration for the command dock.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the command dock feel native to Rideclub's spatial operating-system concept.
The final command dock must not look like a generic admin dashboard.
The final command dock must not look like a generic fintech dashboard.
The final command dock must not look like a generic social feed.
The final command dock must not look like a generic navigation clone.
The final command dock must feel like one cohesive Rideclub cockpit.
# 65 — EDGE RAIL
Define the edge rail as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the edge rail benefits from geographic awareness.
Use a restrained near-black foundation behind the edge rail.
Use #F4F7FA for primary readable values in the edge rail.
Use #AAB1BD for supporting labels in the edge rail.
Use #66707D for low-priority metadata in the edge rail.
Use #FF4D21 only for Rideclub-primary actions in the edge rail.
Use cyan for live communication state when applicable to the edge rail.
Use green for successful or healthy state when applicable to the edge rail.
Use amber for caution state when applicable to the edge rail.
Use red only for critical state when applicable to the edge rail.
Use technical typography for telemetry values associated with the edge rail.
Use human-readable typography for rider-facing copy associated with the edge rail.
Avoid unnecessary rounded rectangles in the edge rail.
Avoid placing every datum inside its own container in the edge rail.
Use one-pixel structural rules when the edge rail needs visual grouping.
Use negative space as the first grouping mechanism in the edge rail.
Use radial geometry when the edge rail represents a measurable quantity.
Use nodes when the edge rail represents people or geographic entities.
Use lines when the edge rail represents a relationship or sequence.
Use rings when the edge rail represents progress, cohesion, or capacity.
Use large numerals when the edge rail contains a primary metric.
Use compact labels when the edge rail contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive edge rail controls.
Provide a larger sixty-four-pixel interaction zone for the most important edge rail action during riding.
Do not require precise tapping for critical edge rail actions.
Use hold-to-confirm for irreversible or safety-sensitive edge rail actions where appropriate.
Provide immediate visual feedback for every interactive edge rail action.
Animate the edge rail only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the edge rail.
Use sixty-to-two-hundred-fifty millisecond transitions for normal edge rail UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the edge rail.
Use opacity changes to establish secondary hierarchy in the edge rail.
Use scale changes sparingly in the edge rail.
Avoid large bounce animations in the edge rail.
Use subtle glow to indicate active state in the edge rail.
Never use glow as the only indicator of an important edge rail state.
Pair important edge rail states with text, iconography, or geometry.
Preserve the visual hierarchy of the edge rail under reduced-motion settings.
Ensure the edge rail remains understandable without animation.
Ensure the edge rail remains usable at high text zoom.
Ensure the edge rail remains usable in strong outdoor light where possible.
Use high contrast between the edge rail primary value and its background.
Do not use tiny gray text for essential edge rail information.
Keep secondary edge rail information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the edge rail.
Use uppercase tracking only for short telemetry labels in the edge rail.
Use tabular numerals for changing edge rail values.
Keep decimal precision consistent across the edge rail.
Use locale-aware formatting for distance and speed in the edge rail.
Use metric units by default for the edge rail when the user is in a metric locale.
Allow unit preferences to be changed in settings for the edge rail.
Use safe-area insets around the edge rail on mobile devices.
Keep important edge rail content away from gesture navigation edges.
Support landscape orientation for riding-focused edge rail screens.
Support portrait orientation for planning-focused edge rail screens.
Allow the edge rail to reorganize rather than simply shrink at smaller widths.
Do not stack every edge rail element vertically on mobile.
Use edge rails for compact edge rail telemetry on narrow screens.
Use bottom sheets only when the edge rail needs temporary detailed interaction.
Avoid permanent bottom sheets for the edge rail unless the screen is specifically designed around one.
Keep map gestures available whenever the edge rail does not require modal focus.
Prevent accidental map gestures while interacting with critical edge rail controls.
Use pointer-events layering intentionally for the edge rail.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the edge rail.
Use MapLibre layers for geographic information whenever possible for the edge rail.
Use DOM overlays only for interaction-heavy edge rail controls.
Keep route geometry visually dominant over secondary map labels in the edge rail.
Dim irrelevant map detail behind active edge rail guidance.
Use a clear active route line for the edge rail.
Use a thinner inactive route line for alternate edge rail paths.
Use checkpoint nodes to divide long edge rail journeys into understandable segments.
Use start and destination markers consistently in the edge rail.
Use directional orientation for moving rider markers in the edge rail.
Avoid using generic pins for every edge rail object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the edge rail.
Use clustering when many edge rail entities overlap.
Use expansion behavior when a edge rail cluster is selected.
Use proximity to determine emphasis for nearby edge rail entities.
Use distance labels only when distance is actionable for the edge rail.
Use live state indicators for connected edge rail entities.
Use stale-state indicators when edge rail data has not updated recently.
Never imply live edge rail data when the network is offline.
Clearly communicate offline state within the edge rail.
Use cached data gracefully for the edge rail.
Design the edge rail to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the edge rail.
Show network state without turning the edge rail into a diagnostic screen.
Keep system diagnostics secondary to the edge rail user goal.
Use haptic-ready interaction semantics for the edge rail where supported.
Use sound-ready states for the edge rail where auditory feedback is useful.
Do not make sound the only indication of a critical edge rail state.
Use clear visual acknowledgment after the edge rail receives an action.
Use optimistic feedback only when the edge rail action can safely be reversed.
Use progress indicators for long-running edge rail operations.
Use skeletons only when they help preserve the edge rail layout.
Avoid generic spinner-only loading states for major edge rail screens.
Provide purposeful empty states for the edge rail.
Provide recovery actions for edge rail errors.
Keep error messages concise and actionable in the edge rail.
Use a technical but human tone for edge rail system messages.
Never use jargon that the rider cannot understand in the edge rail.
Keep safety-critical copy direct and unambiguous in the edge rail.
Validate the edge rail at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the edge rail at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the edge rail in both portrait and landscape layouts.
Validate the edge rail with long rider names.
Validate the edge rail with long route names.
Validate the edge rail with zero riders.
Validate the edge rail with one rider.
Validate the edge rail with a full group.
Validate the edge rail with slow network conditions.
Validate the edge rail with no network.
Validate the edge rail with poor GPS accuracy.
Validate the edge rail with rapidly changing telemetry.
Validate the edge rail with accessibility text scaling.
Validate the edge rail with reduced motion.
Validate the edge rail with keyboard navigation where applicable.
Validate the edge rail with screen readers for non-driving planning contexts.
Validate the edge rail with touch and pointer input.
Validate the edge rail with glove-friendly target sizing.
Document every interactive state of the edge rail.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the edge rail.
Create a reusable component contract for the edge rail.
Keep component APIs semantic rather than visual-only for the edge rail.
Separate data state from presentation state in the edge rail.
Keep animation state separate from business state in the edge rail.
Avoid hardcoding user-specific values into the edge rail.
Drive edge rail values from the application's data layer.
Keep the edge rail resilient to missing optional data.
Keep the edge rail deterministic during replay or ride-history inspection.
Use consistent time formatting across the edge rail.
Use consistent distance formatting across the edge rail.
Use consistent rider status terminology across the edge rail.
Use consistent alert severity terminology across the edge rail.
Use consistent route terminology across the edge rail.
Use consistent checkpoint terminology across the edge rail.
Use consistent connection terminology across the edge rail.
Do not introduce a new visual pattern for the edge rail if an existing pattern already solves the same problem.
Prefer composition over component nesting in the edge rail.
Keep the visual surface of the edge rail calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary edge rail information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the edge rail.
Use the reference HMI's instrument-panel logic as inspiration for the edge rail.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the edge rail feel native to Rideclub's spatial operating-system concept.
The final edge rail must not look like a generic admin dashboard.
The final edge rail must not look like a generic fintech dashboard.
The final edge rail must not look like a generic social feed.
The final edge rail must not look like a generic navigation clone.
The final edge rail must feel like one cohesive Rideclub cockpit.
# 66 — TOP STATUS BAR
Define the top status as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the top status benefits from geographic awareness.
Use a restrained near-black foundation behind the top status.
Use #F4F7FA for primary readable values in the top status.
Use #AAB1BD for supporting labels in the top status.
Use #66707D for low-priority metadata in the top status.
Use #FF4D21 only for Rideclub-primary actions in the top status.
Use cyan for live communication state when applicable to the top status.
Use green for successful or healthy state when applicable to the top status.
Use amber for caution state when applicable to the top status.
Use red only for critical state when applicable to the top status.
Use technical typography for telemetry values associated with the top status.
Use human-readable typography for rider-facing copy associated with the top status.
Avoid unnecessary rounded rectangles in the top status.
Avoid placing every datum inside its own container in the top status.
Use one-pixel structural rules when the top status needs visual grouping.
Use negative space as the first grouping mechanism in the top status.
Use radial geometry when the top status represents a measurable quantity.
Use nodes when the top status represents people or geographic entities.
Use lines when the top status represents a relationship or sequence.
Use rings when the top status represents progress, cohesion, or capacity.
Use large numerals when the top status contains a primary metric.
Use compact labels when the top status contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive top status controls.
Provide a larger sixty-four-pixel interaction zone for the most important top status action during riding.
Do not require precise tapping for critical top status actions.
Use hold-to-confirm for irreversible or safety-sensitive top status actions where appropriate.
Provide immediate visual feedback for every interactive top status action.
Animate the top status only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the top status.
Use sixty-to-two-hundred-fifty millisecond transitions for normal top status UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the top status.
Use opacity changes to establish secondary hierarchy in the top status.
Use scale changes sparingly in the top status.
Avoid large bounce animations in the top status.
Use subtle glow to indicate active state in the top status.
Never use glow as the only indicator of an important top status state.
Pair important top status states with text, iconography, or geometry.
Preserve the visual hierarchy of the top status under reduced-motion settings.
Ensure the top status remains understandable without animation.
Ensure the top status remains usable at high text zoom.
Ensure the top status remains usable in strong outdoor light where possible.
Use high contrast between the top status primary value and its background.
Do not use tiny gray text for essential top status information.
Keep secondary top status information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the top status.
Use uppercase tracking only for short telemetry labels in the top status.
Use tabular numerals for changing top status values.
Keep decimal precision consistent across the top status.
Use locale-aware formatting for distance and speed in the top status.
Use metric units by default for the top status when the user is in a metric locale.
Allow unit preferences to be changed in settings for the top status.
Use safe-area insets around the top status on mobile devices.
Keep important top status content away from gesture navigation edges.
Support landscape orientation for riding-focused top status screens.
Support portrait orientation for planning-focused top status screens.
Allow the top status to reorganize rather than simply shrink at smaller widths.
Do not stack every top status element vertically on mobile.
Use edge rails for compact top status telemetry on narrow screens.
Use bottom sheets only when the top status needs temporary detailed interaction.
Avoid permanent bottom sheets for the top status unless the screen is specifically designed around one.
Keep map gestures available whenever the top status does not require modal focus.
Prevent accidental map gestures while interacting with critical top status controls.
Use pointer-events layering intentionally for the top status.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the top status.
Use MapLibre layers for geographic information whenever possible for the top status.
Use DOM overlays only for interaction-heavy top status controls.
Keep route geometry visually dominant over secondary map labels in the top status.
Dim irrelevant map detail behind active top status guidance.
Use a clear active route line for the top status.
Use a thinner inactive route line for alternate top status paths.
Use checkpoint nodes to divide long top status journeys into understandable segments.
Use start and destination markers consistently in the top status.
Use directional orientation for moving rider markers in the top status.
Avoid using generic pins for every top status object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the top status.
Use clustering when many top status entities overlap.
Use expansion behavior when a top status cluster is selected.
Use proximity to determine emphasis for nearby top status entities.
Use distance labels only when distance is actionable for the top status.
Use live state indicators for connected top status entities.
Use stale-state indicators when top status data has not updated recently.
Never imply live top status data when the network is offline.
Clearly communicate offline state within the top status.
Use cached data gracefully for the top status.
Design the top status to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the top status.
Show network state without turning the top status into a diagnostic screen.
Keep system diagnostics secondary to the top status user goal.
Use haptic-ready interaction semantics for the top status where supported.
Use sound-ready states for the top status where auditory feedback is useful.
Do not make sound the only indication of a critical top status state.
Use clear visual acknowledgment after the top status receives an action.
Use optimistic feedback only when the top status action can safely be reversed.
Use progress indicators for long-running top status operations.
Use skeletons only when they help preserve the top status layout.
Avoid generic spinner-only loading states for major top status screens.
Provide purposeful empty states for the top status.
Provide recovery actions for top status errors.
Keep error messages concise and actionable in the top status.
Use a technical but human tone for top status system messages.
Never use jargon that the rider cannot understand in the top status.
Keep safety-critical copy direct and unambiguous in the top status.
Validate the top status at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the top status at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the top status in both portrait and landscape layouts.
Validate the top status with long rider names.
Validate the top status with long route names.
Validate the top status with zero riders.
Validate the top status with one rider.
Validate the top status with a full group.
Validate the top status with slow network conditions.
Validate the top status with no network.
Validate the top status with poor GPS accuracy.
Validate the top status with rapidly changing telemetry.
Validate the top status with accessibility text scaling.
Validate the top status with reduced motion.
Validate the top status with keyboard navigation where applicable.
Validate the top status with screen readers for non-driving planning contexts.
Validate the top status with touch and pointer input.
Validate the top status with glove-friendly target sizing.
Document every interactive state of the top status.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the top status.
Create a reusable component contract for the top status.
Keep component APIs semantic rather than visual-only for the top status.
Separate data state from presentation state in the top status.
Keep animation state separate from business state in the top status.
Avoid hardcoding user-specific values into the top status.
Drive top status values from the application's data layer.
Keep the top status resilient to missing optional data.
Keep the top status deterministic during replay or ride-history inspection.
Use consistent time formatting across the top status.
Use consistent distance formatting across the top status.
Use consistent rider status terminology across the top status.
Use consistent alert severity terminology across the top status.
Use consistent route terminology across the top status.
Use consistent checkpoint terminology across the top status.
Use consistent connection terminology across the top status.
Do not introduce a new visual pattern for the top status if an existing pattern already solves the same problem.
Prefer composition over component nesting in the top status.
Keep the visual surface of the top status calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary top status information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the top status.
Use the reference HMI's instrument-panel logic as inspiration for the top status.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the top status feel native to Rideclub's spatial operating-system concept.
The final top status must not look like a generic admin dashboard.
The final top status must not look like a generic fintech dashboard.
The final top status must not look like a generic social feed.
The final top status must not look like a generic navigation clone.
The final top status must feel like one cohesive Rideclub cockpit.
# 67 — BOTTOM CONTROL BAR
Define the bottom control as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the bottom control benefits from geographic awareness.
Use a restrained near-black foundation behind the bottom control.
Use #F4F7FA for primary readable values in the bottom control.
Use #AAB1BD for supporting labels in the bottom control.
Use #66707D for low-priority metadata in the bottom control.
Use #FF4D21 only for Rideclub-primary actions in the bottom control.
Use cyan for live communication state when applicable to the bottom control.
Use green for successful or healthy state when applicable to the bottom control.
Use amber for caution state when applicable to the bottom control.
Use red only for critical state when applicable to the bottom control.
Use technical typography for telemetry values associated with the bottom control.
Use human-readable typography for rider-facing copy associated with the bottom control.
Avoid unnecessary rounded rectangles in the bottom control.
Avoid placing every datum inside its own container in the bottom control.
Use one-pixel structural rules when the bottom control needs visual grouping.
Use negative space as the first grouping mechanism in the bottom control.
Use radial geometry when the bottom control represents a measurable quantity.
Use nodes when the bottom control represents people or geographic entities.
Use lines when the bottom control represents a relationship or sequence.
Use rings when the bottom control represents progress, cohesion, or capacity.
Use large numerals when the bottom control contains a primary metric.
Use compact labels when the bottom control contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive bottom control controls.
Provide a larger sixty-four-pixel interaction zone for the most important bottom control action during riding.
Do not require precise tapping for critical bottom control actions.
Use hold-to-confirm for irreversible or safety-sensitive bottom control actions where appropriate.
Provide immediate visual feedback for every interactive bottom control action.
Animate the bottom control only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the bottom control.
Use sixty-to-two-hundred-fifty millisecond transitions for normal bottom control UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the bottom control.
Use opacity changes to establish secondary hierarchy in the bottom control.
Use scale changes sparingly in the bottom control.
Avoid large bounce animations in the bottom control.
Use subtle glow to indicate active state in the bottom control.
Never use glow as the only indicator of an important bottom control state.
Pair important bottom control states with text, iconography, or geometry.
Preserve the visual hierarchy of the bottom control under reduced-motion settings.
Ensure the bottom control remains understandable without animation.
Ensure the bottom control remains usable at high text zoom.
Ensure the bottom control remains usable in strong outdoor light where possible.
Use high contrast between the bottom control primary value and its background.
Do not use tiny gray text for essential bottom control information.
Keep secondary bottom control information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the bottom control.
Use uppercase tracking only for short telemetry labels in the bottom control.
Use tabular numerals for changing bottom control values.
Keep decimal precision consistent across the bottom control.
Use locale-aware formatting for distance and speed in the bottom control.
Use metric units by default for the bottom control when the user is in a metric locale.
Allow unit preferences to be changed in settings for the bottom control.
Use safe-area insets around the bottom control on mobile devices.
Keep important bottom control content away from gesture navigation edges.
Support landscape orientation for riding-focused bottom control screens.
Support portrait orientation for planning-focused bottom control screens.
Allow the bottom control to reorganize rather than simply shrink at smaller widths.
Do not stack every bottom control element vertically on mobile.
Use edge rails for compact bottom control telemetry on narrow screens.
Use bottom sheets only when the bottom control needs temporary detailed interaction.
Avoid permanent bottom sheets for the bottom control unless the screen is specifically designed around one.
Keep map gestures available whenever the bottom control does not require modal focus.
Prevent accidental map gestures while interacting with critical bottom control controls.
Use pointer-events layering intentionally for the bottom control.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the bottom control.
Use MapLibre layers for geographic information whenever possible for the bottom control.
Use DOM overlays only for interaction-heavy bottom control controls.
Keep route geometry visually dominant over secondary map labels in the bottom control.
Dim irrelevant map detail behind active bottom control guidance.
Use a clear active route line for the bottom control.
Use a thinner inactive route line for alternate bottom control paths.
Use checkpoint nodes to divide long bottom control journeys into understandable segments.
Use start and destination markers consistently in the bottom control.
Use directional orientation for moving rider markers in the bottom control.
Avoid using generic pins for every bottom control object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the bottom control.
Use clustering when many bottom control entities overlap.
Use expansion behavior when a bottom control cluster is selected.
Use proximity to determine emphasis for nearby bottom control entities.
Use distance labels only when distance is actionable for the bottom control.
Use live state indicators for connected bottom control entities.
Use stale-state indicators when bottom control data has not updated recently.
Never imply live bottom control data when the network is offline.
Clearly communicate offline state within the bottom control.
Use cached data gracefully for the bottom control.
Design the bottom control to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the bottom control.
Show network state without turning the bottom control into a diagnostic screen.
Keep system diagnostics secondary to the bottom control user goal.
Use haptic-ready interaction semantics for the bottom control where supported.
Use sound-ready states for the bottom control where auditory feedback is useful.
Do not make sound the only indication of a critical bottom control state.
Use clear visual acknowledgment after the bottom control receives an action.
Use optimistic feedback only when the bottom control action can safely be reversed.
Use progress indicators for long-running bottom control operations.
Use skeletons only when they help preserve the bottom control layout.
Avoid generic spinner-only loading states for major bottom control screens.
Provide purposeful empty states for the bottom control.
Provide recovery actions for bottom control errors.
Keep error messages concise and actionable in the bottom control.
Use a technical but human tone for bottom control system messages.
Never use jargon that the rider cannot understand in the bottom control.
Keep safety-critical copy direct and unambiguous in the bottom control.
Validate the bottom control at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the bottom control at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the bottom control in both portrait and landscape layouts.
Validate the bottom control with long rider names.
Validate the bottom control with long route names.
Validate the bottom control with zero riders.
Validate the bottom control with one rider.
Validate the bottom control with a full group.
Validate the bottom control with slow network conditions.
Validate the bottom control with no network.
Validate the bottom control with poor GPS accuracy.
Validate the bottom control with rapidly changing telemetry.
Validate the bottom control with accessibility text scaling.
Validate the bottom control with reduced motion.
Validate the bottom control with keyboard navigation where applicable.
Validate the bottom control with screen readers for non-driving planning contexts.
Validate the bottom control with touch and pointer input.
Validate the bottom control with glove-friendly target sizing.
Document every interactive state of the bottom control.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the bottom control.
Create a reusable component contract for the bottom control.
Keep component APIs semantic rather than visual-only for the bottom control.
Separate data state from presentation state in the bottom control.
Keep animation state separate from business state in the bottom control.
Avoid hardcoding user-specific values into the bottom control.
Drive bottom control values from the application's data layer.
Keep the bottom control resilient to missing optional data.
Keep the bottom control deterministic during replay or ride-history inspection.
Use consistent time formatting across the bottom control.
Use consistent distance formatting across the bottom control.
Use consistent rider status terminology across the bottom control.
Use consistent alert severity terminology across the bottom control.
Use consistent route terminology across the bottom control.
Use consistent checkpoint terminology across the bottom control.
Use consistent connection terminology across the bottom control.
Do not introduce a new visual pattern for the bottom control if an existing pattern already solves the same problem.
Prefer composition over component nesting in the bottom control.
Keep the visual surface of the bottom control calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary bottom control information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the bottom control.
Use the reference HMI's instrument-panel logic as inspiration for the bottom control.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the bottom control feel native to Rideclub's spatial operating-system concept.
The final bottom control must not look like a generic admin dashboard.
The final bottom control must not look like a generic fintech dashboard.
The final bottom control must not look like a generic social feed.
The final bottom control must not look like a generic navigation clone.
The final bottom control must feel like one cohesive Rideclub cockpit.
# 68 — GESTURE SYSTEM
Define the gestures as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the gestures benefits from geographic awareness.
Use a restrained near-black foundation behind the gestures.
Use #F4F7FA for primary readable values in the gestures.
Use #AAB1BD for supporting labels in the gestures.
Use #66707D for low-priority metadata in the gestures.
Use #FF4D21 only for Rideclub-primary actions in the gestures.
Use cyan for live communication state when applicable to the gestures.
Use green for successful or healthy state when applicable to the gestures.
Use amber for caution state when applicable to the gestures.
Use red only for critical state when applicable to the gestures.
Use technical typography for telemetry values associated with the gestures.
Use human-readable typography for rider-facing copy associated with the gestures.
Avoid unnecessary rounded rectangles in the gestures.
Avoid placing every datum inside its own container in the gestures.
Use one-pixel structural rules when the gestures needs visual grouping.
Use negative space as the first grouping mechanism in the gestures.
Use radial geometry when the gestures represents a measurable quantity.
Use nodes when the gestures represents people or geographic entities.
Use lines when the gestures represents a relationship or sequence.
Use rings when the gestures represents progress, cohesion, or capacity.
Use large numerals when the gestures contains a primary metric.
Use compact labels when the gestures contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive gestures controls.
Provide a larger sixty-four-pixel interaction zone for the most important gestures action during riding.
Do not require precise tapping for critical gestures actions.
Use hold-to-confirm for irreversible or safety-sensitive gestures actions where appropriate.
Provide immediate visual feedback for every interactive gestures action.
Animate the gestures only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the gestures.
Use sixty-to-two-hundred-fifty millisecond transitions for normal gestures UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the gestures.
Use opacity changes to establish secondary hierarchy in the gestures.
Use scale changes sparingly in the gestures.
Avoid large bounce animations in the gestures.
Use subtle glow to indicate active state in the gestures.
Never use glow as the only indicator of an important gestures state.
Pair important gestures states with text, iconography, or geometry.
Preserve the visual hierarchy of the gestures under reduced-motion settings.
Ensure the gestures remains understandable without animation.
Ensure the gestures remains usable at high text zoom.
Ensure the gestures remains usable in strong outdoor light where possible.
Use high contrast between the gestures primary value and its background.
Do not use tiny gray text for essential gestures information.
Keep secondary gestures information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the gestures.
Use uppercase tracking only for short telemetry labels in the gestures.
Use tabular numerals for changing gestures values.
Keep decimal precision consistent across the gestures.
Use locale-aware formatting for distance and speed in the gestures.
Use metric units by default for the gestures when the user is in a metric locale.
Allow unit preferences to be changed in settings for the gestures.
Use safe-area insets around the gestures on mobile devices.
Keep important gestures content away from gesture navigation edges.
Support landscape orientation for riding-focused gestures screens.
Support portrait orientation for planning-focused gestures screens.
Allow the gestures to reorganize rather than simply shrink at smaller widths.
Do not stack every gestures element vertically on mobile.
Use edge rails for compact gestures telemetry on narrow screens.
Use bottom sheets only when the gestures needs temporary detailed interaction.
Avoid permanent bottom sheets for the gestures unless the screen is specifically designed around one.
Keep map gestures available whenever the gestures does not require modal focus.
Prevent accidental map gestures while interacting with critical gestures controls.
Use pointer-events layering intentionally for the gestures.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the gestures.
Use MapLibre layers for geographic information whenever possible for the gestures.
Use DOM overlays only for interaction-heavy gestures controls.
Keep route geometry visually dominant over secondary map labels in the gestures.
Dim irrelevant map detail behind active gestures guidance.
Use a clear active route line for the gestures.
Use a thinner inactive route line for alternate gestures paths.
Use checkpoint nodes to divide long gestures journeys into understandable segments.
Use start and destination markers consistently in the gestures.
Use directional orientation for moving rider markers in the gestures.
Avoid using generic pins for every gestures object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the gestures.
Use clustering when many gestures entities overlap.
Use expansion behavior when a gestures cluster is selected.
Use proximity to determine emphasis for nearby gestures entities.
Use distance labels only when distance is actionable for the gestures.
Use live state indicators for connected gestures entities.
Use stale-state indicators when gestures data has not updated recently.
Never imply live gestures data when the network is offline.
Clearly communicate offline state within the gestures.
Use cached data gracefully for the gestures.
Design the gestures to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the gestures.
Show network state without turning the gestures into a diagnostic screen.
Keep system diagnostics secondary to the gestures user goal.
Use haptic-ready interaction semantics for the gestures where supported.
Use sound-ready states for the gestures where auditory feedback is useful.
Do not make sound the only indication of a critical gestures state.
Use clear visual acknowledgment after the gestures receives an action.
Use optimistic feedback only when the gestures action can safely be reversed.
Use progress indicators for long-running gestures operations.
Use skeletons only when they help preserve the gestures layout.
Avoid generic spinner-only loading states for major gestures screens.
Provide purposeful empty states for the gestures.
Provide recovery actions for gestures errors.
Keep error messages concise and actionable in the gestures.
Use a technical but human tone for gestures system messages.
Never use jargon that the rider cannot understand in the gestures.
Keep safety-critical copy direct and unambiguous in the gestures.
Validate the gestures at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the gestures at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the gestures in both portrait and landscape layouts.
Validate the gestures with long rider names.
Validate the gestures with long route names.
Validate the gestures with zero riders.
Validate the gestures with one rider.
Validate the gestures with a full group.
Validate the gestures with slow network conditions.
Validate the gestures with no network.
Validate the gestures with poor GPS accuracy.
Validate the gestures with rapidly changing telemetry.
Validate the gestures with accessibility text scaling.
Validate the gestures with reduced motion.
Validate the gestures with keyboard navigation where applicable.
Validate the gestures with screen readers for non-driving planning contexts.
Validate the gestures with touch and pointer input.
Validate the gestures with glove-friendly target sizing.
Document every interactive state of the gestures.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the gestures.
Create a reusable component contract for the gestures.
Keep component APIs semantic rather than visual-only for the gestures.
Separate data state from presentation state in the gestures.
Keep animation state separate from business state in the gestures.
Avoid hardcoding user-specific values into the gestures.
Drive gestures values from the application's data layer.
Keep the gestures resilient to missing optional data.
Keep the gestures deterministic during replay or ride-history inspection.
Use consistent time formatting across the gestures.
Use consistent distance formatting across the gestures.
Use consistent rider status terminology across the gestures.
Use consistent alert severity terminology across the gestures.
Use consistent route terminology across the gestures.
Use consistent checkpoint terminology across the gestures.
Use consistent connection terminology across the gestures.
Do not introduce a new visual pattern for the gestures if an existing pattern already solves the same problem.
Prefer composition over component nesting in the gestures.
Keep the visual surface of the gestures calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary gestures information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the gestures.
Use the reference HMI's instrument-panel logic as inspiration for the gestures.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the gestures feel native to Rideclub's spatial operating-system concept.
The final gestures must not look like a generic admin dashboard.
The final gestures must not look like a generic fintech dashboard.
The final gestures must not look like a generic social feed.
The final gestures must not look like a generic navigation clone.
The final gestures must feel like one cohesive Rideclub cockpit.
# 69 — HOLD ACTIONS
Define the hold actions as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the hold actions benefits from geographic awareness.
Use a restrained near-black foundation behind the hold actions.
Use #F4F7FA for primary readable values in the hold actions.
Use #AAB1BD for supporting labels in the hold actions.
Use #66707D for low-priority metadata in the hold actions.
Use #FF4D21 only for Rideclub-primary actions in the hold actions.
Use cyan for live communication state when applicable to the hold actions.
Use green for successful or healthy state when applicable to the hold actions.
Use amber for caution state when applicable to the hold actions.
Use red only for critical state when applicable to the hold actions.
Use technical typography for telemetry values associated with the hold actions.
Use human-readable typography for rider-facing copy associated with the hold actions.
Avoid unnecessary rounded rectangles in the hold actions.
Avoid placing every datum inside its own container in the hold actions.
Use one-pixel structural rules when the hold actions needs visual grouping.
Use negative space as the first grouping mechanism in the hold actions.
Use radial geometry when the hold actions represents a measurable quantity.
Use nodes when the hold actions represents people or geographic entities.
Use lines when the hold actions represents a relationship or sequence.
Use rings when the hold actions represents progress, cohesion, or capacity.
Use large numerals when the hold actions contains a primary metric.
Use compact labels when the hold actions contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive hold actions controls.
Provide a larger sixty-four-pixel interaction zone for the most important hold actions action during riding.
Do not require precise tapping for critical hold actions actions.
Use hold-to-confirm for irreversible or safety-sensitive hold actions actions where appropriate.
Provide immediate visual feedback for every interactive hold actions action.
Animate the hold actions only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the hold actions.
Use sixty-to-two-hundred-fifty millisecond transitions for normal hold actions UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the hold actions.
Use opacity changes to establish secondary hierarchy in the hold actions.
Use scale changes sparingly in the hold actions.
Avoid large bounce animations in the hold actions.
Use subtle glow to indicate active state in the hold actions.
Never use glow as the only indicator of an important hold actions state.
Pair important hold actions states with text, iconography, or geometry.
Preserve the visual hierarchy of the hold actions under reduced-motion settings.
Ensure the hold actions remains understandable without animation.
Ensure the hold actions remains usable at high text zoom.
Ensure the hold actions remains usable in strong outdoor light where possible.
Use high contrast between the hold actions primary value and its background.
Do not use tiny gray text for essential hold actions information.
Keep secondary hold actions information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the hold actions.
Use uppercase tracking only for short telemetry labels in the hold actions.
Use tabular numerals for changing hold actions values.
Keep decimal precision consistent across the hold actions.
Use locale-aware formatting for distance and speed in the hold actions.
Use metric units by default for the hold actions when the user is in a metric locale.
Allow unit preferences to be changed in settings for the hold actions.
Use safe-area insets around the hold actions on mobile devices.
Keep important hold actions content away from gesture navigation edges.
Support landscape orientation for riding-focused hold actions screens.
Support portrait orientation for planning-focused hold actions screens.
Allow the hold actions to reorganize rather than simply shrink at smaller widths.
Do not stack every hold actions element vertically on mobile.
Use edge rails for compact hold actions telemetry on narrow screens.
Use bottom sheets only when the hold actions needs temporary detailed interaction.
Avoid permanent bottom sheets for the hold actions unless the screen is specifically designed around one.
Keep map gestures available whenever the hold actions does not require modal focus.
Prevent accidental map gestures while interacting with critical hold actions controls.
Use pointer-events layering intentionally for the hold actions.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the hold actions.
Use MapLibre layers for geographic information whenever possible for the hold actions.
Use DOM overlays only for interaction-heavy hold actions controls.
Keep route geometry visually dominant over secondary map labels in the hold actions.
Dim irrelevant map detail behind active hold actions guidance.
Use a clear active route line for the hold actions.
Use a thinner inactive route line for alternate hold actions paths.
Use checkpoint nodes to divide long hold actions journeys into understandable segments.
Use start and destination markers consistently in the hold actions.
Use directional orientation for moving rider markers in the hold actions.
Avoid using generic pins for every hold actions object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the hold actions.
Use clustering when many hold actions entities overlap.
Use expansion behavior when a hold actions cluster is selected.
Use proximity to determine emphasis for nearby hold actions entities.
Use distance labels only when distance is actionable for the hold actions.
Use live state indicators for connected hold actions entities.
Use stale-state indicators when hold actions data has not updated recently.
Never imply live hold actions data when the network is offline.
Clearly communicate offline state within the hold actions.
Use cached data gracefully for the hold actions.
Design the hold actions to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the hold actions.
Show network state without turning the hold actions into a diagnostic screen.
Keep system diagnostics secondary to the hold actions user goal.
Use haptic-ready interaction semantics for the hold actions where supported.
Use sound-ready states for the hold actions where auditory feedback is useful.
Do not make sound the only indication of a critical hold actions state.
Use clear visual acknowledgment after the hold actions receives an action.
Use optimistic feedback only when the hold actions action can safely be reversed.
Use progress indicators for long-running hold actions operations.
Use skeletons only when they help preserve the hold actions layout.
Avoid generic spinner-only loading states for major hold actions screens.
Provide purposeful empty states for the hold actions.
Provide recovery actions for hold actions errors.
Keep error messages concise and actionable in the hold actions.
Use a technical but human tone for hold actions system messages.
Never use jargon that the rider cannot understand in the hold actions.
Keep safety-critical copy direct and unambiguous in the hold actions.
Validate the hold actions at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the hold actions at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the hold actions in both portrait and landscape layouts.
Validate the hold actions with long rider names.
Validate the hold actions with long route names.
Validate the hold actions with zero riders.
Validate the hold actions with one rider.
Validate the hold actions with a full group.
Validate the hold actions with slow network conditions.
Validate the hold actions with no network.
Validate the hold actions with poor GPS accuracy.
Validate the hold actions with rapidly changing telemetry.
Validate the hold actions with accessibility text scaling.
Validate the hold actions with reduced motion.
Validate the hold actions with keyboard navigation where applicable.
Validate the hold actions with screen readers for non-driving planning contexts.
Validate the hold actions with touch and pointer input.
Validate the hold actions with glove-friendly target sizing.
Document every interactive state of the hold actions.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the hold actions.
Create a reusable component contract for the hold actions.
Keep component APIs semantic rather than visual-only for the hold actions.
Separate data state from presentation state in the hold actions.
Keep animation state separate from business state in the hold actions.
Avoid hardcoding user-specific values into the hold actions.
Drive hold actions values from the application's data layer.
Keep the hold actions resilient to missing optional data.
Keep the hold actions deterministic during replay or ride-history inspection.
Use consistent time formatting across the hold actions.
Use consistent distance formatting across the hold actions.
Use consistent rider status terminology across the hold actions.
Use consistent alert severity terminology across the hold actions.
Use consistent route terminology across the hold actions.
Use consistent checkpoint terminology across the hold actions.
Use consistent connection terminology across the hold actions.
Do not introduce a new visual pattern for the hold actions if an existing pattern already solves the same problem.
Prefer composition over component nesting in the hold actions.
Keep the visual surface of the hold actions calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary hold actions information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the hold actions.
Use the reference HMI's instrument-panel logic as inspiration for the hold actions.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the hold actions feel native to Rideclub's spatial operating-system concept.
The final hold actions must not look like a generic admin dashboard.
The final hold actions must not look like a generic fintech dashboard.
The final hold actions must not look like a generic social feed.
The final hold actions must not look like a generic navigation clone.
The final hold actions must feel like one cohesive Rideclub cockpit.
# 70 — PRESSURE STATES
Define the press states as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the press states benefits from geographic awareness.
Use a restrained near-black foundation behind the press states.
Use #F4F7FA for primary readable values in the press states.
Use #AAB1BD for supporting labels in the press states.
Use #66707D for low-priority metadata in the press states.
Use #FF4D21 only for Rideclub-primary actions in the press states.
Use cyan for live communication state when applicable to the press states.
Use green for successful or healthy state when applicable to the press states.
Use amber for caution state when applicable to the press states.
Use red only for critical state when applicable to the press states.
Use technical typography for telemetry values associated with the press states.
Use human-readable typography for rider-facing copy associated with the press states.
Avoid unnecessary rounded rectangles in the press states.
Avoid placing every datum inside its own container in the press states.
Use one-pixel structural rules when the press states needs visual grouping.
Use negative space as the first grouping mechanism in the press states.
Use radial geometry when the press states represents a measurable quantity.
Use nodes when the press states represents people or geographic entities.
Use lines when the press states represents a relationship or sequence.
Use rings when the press states represents progress, cohesion, or capacity.
Use large numerals when the press states contains a primary metric.
Use compact labels when the press states contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive press states controls.
Provide a larger sixty-four-pixel interaction zone for the most important press states action during riding.
Do not require precise tapping for critical press states actions.
Use hold-to-confirm for irreversible or safety-sensitive press states actions where appropriate.
Provide immediate visual feedback for every interactive press states action.
Animate the press states only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the press states.
Use sixty-to-two-hundred-fifty millisecond transitions for normal press states UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the press states.
Use opacity changes to establish secondary hierarchy in the press states.
Use scale changes sparingly in the press states.
Avoid large bounce animations in the press states.
Use subtle glow to indicate active state in the press states.
Never use glow as the only indicator of an important press states state.
Pair important press states states with text, iconography, or geometry.
Preserve the visual hierarchy of the press states under reduced-motion settings.
Ensure the press states remains understandable without animation.
Ensure the press states remains usable at high text zoom.
Ensure the press states remains usable in strong outdoor light where possible.
Use high contrast between the press states primary value and its background.
Do not use tiny gray text for essential press states information.
Keep secondary press states information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the press states.
Use uppercase tracking only for short telemetry labels in the press states.
Use tabular numerals for changing press states values.
Keep decimal precision consistent across the press states.
Use locale-aware formatting for distance and speed in the press states.
Use metric units by default for the press states when the user is in a metric locale.
Allow unit preferences to be changed in settings for the press states.
Use safe-area insets around the press states on mobile devices.
Keep important press states content away from gesture navigation edges.
Support landscape orientation for riding-focused press states screens.
Support portrait orientation for planning-focused press states screens.
Allow the press states to reorganize rather than simply shrink at smaller widths.
Do not stack every press states element vertically on mobile.
Use edge rails for compact press states telemetry on narrow screens.
Use bottom sheets only when the press states needs temporary detailed interaction.
Avoid permanent bottom sheets for the press states unless the screen is specifically designed around one.
Keep map gestures available whenever the press states does not require modal focus.
Prevent accidental map gestures while interacting with critical press states controls.
Use pointer-events layering intentionally for the press states.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the press states.
Use MapLibre layers for geographic information whenever possible for the press states.
Use DOM overlays only for interaction-heavy press states controls.
Keep route geometry visually dominant over secondary map labels in the press states.
Dim irrelevant map detail behind active press states guidance.
Use a clear active route line for the press states.
Use a thinner inactive route line for alternate press states paths.
Use checkpoint nodes to divide long press states journeys into understandable segments.
Use start and destination markers consistently in the press states.
Use directional orientation for moving rider markers in the press states.
Avoid using generic pins for every press states object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the press states.
Use clustering when many press states entities overlap.
Use expansion behavior when a press states cluster is selected.
Use proximity to determine emphasis for nearby press states entities.
Use distance labels only when distance is actionable for the press states.
Use live state indicators for connected press states entities.
Use stale-state indicators when press states data has not updated recently.
Never imply live press states data when the network is offline.
Clearly communicate offline state within the press states.
Use cached data gracefully for the press states.
Design the press states to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the press states.
Show network state without turning the press states into a diagnostic screen.
Keep system diagnostics secondary to the press states user goal.
Use haptic-ready interaction semantics for the press states where supported.
Use sound-ready states for the press states where auditory feedback is useful.
Do not make sound the only indication of a critical press states state.
Use clear visual acknowledgment after the press states receives an action.
Use optimistic feedback only when the press states action can safely be reversed.
Use progress indicators for long-running press states operations.
Use skeletons only when they help preserve the press states layout.
Avoid generic spinner-only loading states for major press states screens.
Provide purposeful empty states for the press states.
Provide recovery actions for press states errors.
Keep error messages concise and actionable in the press states.
Use a technical but human tone for press states system messages.
Never use jargon that the rider cannot understand in the press states.
Keep safety-critical copy direct and unambiguous in the press states.
Validate the press states at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the press states at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the press states in both portrait and landscape layouts.
Validate the press states with long rider names.
Validate the press states with long route names.
Validate the press states with zero riders.
Validate the press states with one rider.
Validate the press states with a full group.
Validate the press states with slow network conditions.
Validate the press states with no network.
Validate the press states with poor GPS accuracy.
Validate the press states with rapidly changing telemetry.
Validate the press states with accessibility text scaling.
Validate the press states with reduced motion.
Validate the press states with keyboard navigation where applicable.
Validate the press states with screen readers for non-driving planning contexts.
Validate the press states with touch and pointer input.
Validate the press states with glove-friendly target sizing.
Document every interactive state of the press states.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the press states.
Create a reusable component contract for the press states.
Keep component APIs semantic rather than visual-only for the press states.
Separate data state from presentation state in the press states.
Keep animation state separate from business state in the press states.
Avoid hardcoding user-specific values into the press states.
Drive press states values from the application's data layer.
Keep the press states resilient to missing optional data.
Keep the press states deterministic during replay or ride-history inspection.
Use consistent time formatting across the press states.
Use consistent distance formatting across the press states.
Use consistent rider status terminology across the press states.
Use consistent alert severity terminology across the press states.
Use consistent route terminology across the press states.
Use consistent checkpoint terminology across the press states.
Use consistent connection terminology across the press states.
Do not introduce a new visual pattern for the press states if an existing pattern already solves the same problem.
Prefer composition over component nesting in the press states.
Keep the visual surface of the press states calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary press states information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the press states.
Use the reference HMI's instrument-panel logic as inspiration for the press states.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the press states feel native to Rideclub's spatial operating-system concept.
The final press states must not look like a generic admin dashboard.
The final press states must not look like a generic fintech dashboard.
The final press states must not look like a generic social feed.
The final press states must not look like a generic navigation clone.
The final press states must feel like one cohesive Rideclub cockpit.
# 71 — MICROINTERACTIONS
Define the micro interactions as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the micro interactions benefits from geographic awareness.
Use a restrained near-black foundation behind the micro interactions.
Use #F4F7FA for primary readable values in the micro interactions.
Use #AAB1BD for supporting labels in the micro interactions.
Use #66707D for low-priority metadata in the micro interactions.
Use #FF4D21 only for Rideclub-primary actions in the micro interactions.
Use cyan for live communication state when applicable to the micro interactions.
Use green for successful or healthy state when applicable to the micro interactions.
Use amber for caution state when applicable to the micro interactions.
Use red only for critical state when applicable to the micro interactions.
Use technical typography for telemetry values associated with the micro interactions.
Use human-readable typography for rider-facing copy associated with the micro interactions.
Avoid unnecessary rounded rectangles in the micro interactions.
Avoid placing every datum inside its own container in the micro interactions.
Use one-pixel structural rules when the micro interactions needs visual grouping.
Use negative space as the first grouping mechanism in the micro interactions.
Use radial geometry when the micro interactions represents a measurable quantity.
Use nodes when the micro interactions represents people or geographic entities.
Use lines when the micro interactions represents a relationship or sequence.
Use rings when the micro interactions represents progress, cohesion, or capacity.
Use large numerals when the micro interactions contains a primary metric.
Use compact labels when the micro interactions contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive micro interactions controls.
Provide a larger sixty-four-pixel interaction zone for the most important micro interactions action during riding.
Do not require precise tapping for critical micro interactions actions.
Use hold-to-confirm for irreversible or safety-sensitive micro interactions actions where appropriate.
Provide immediate visual feedback for every interactive micro interactions action.
Animate the micro interactions only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the micro interactions.
Use sixty-to-two-hundred-fifty millisecond transitions for normal micro interactions UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the micro interactions.
Use opacity changes to establish secondary hierarchy in the micro interactions.
Use scale changes sparingly in the micro interactions.
Avoid large bounce animations in the micro interactions.
Use subtle glow to indicate active state in the micro interactions.
Never use glow as the only indicator of an important micro interactions state.
Pair important micro interactions states with text, iconography, or geometry.
Preserve the visual hierarchy of the micro interactions under reduced-motion settings.
Ensure the micro interactions remains understandable without animation.
Ensure the micro interactions remains usable at high text zoom.
Ensure the micro interactions remains usable in strong outdoor light where possible.
Use high contrast between the micro interactions primary value and its background.
Do not use tiny gray text for essential micro interactions information.
Keep secondary micro interactions information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the micro interactions.
Use uppercase tracking only for short telemetry labels in the micro interactions.
Use tabular numerals for changing micro interactions values.
Keep decimal precision consistent across the micro interactions.
Use locale-aware formatting for distance and speed in the micro interactions.
Use metric units by default for the micro interactions when the user is in a metric locale.
Allow unit preferences to be changed in settings for the micro interactions.
Use safe-area insets around the micro interactions on mobile devices.
Keep important micro interactions content away from gesture navigation edges.
Support landscape orientation for riding-focused micro interactions screens.
Support portrait orientation for planning-focused micro interactions screens.
Allow the micro interactions to reorganize rather than simply shrink at smaller widths.
Do not stack every micro interactions element vertically on mobile.
Use edge rails for compact micro interactions telemetry on narrow screens.
Use bottom sheets only when the micro interactions needs temporary detailed interaction.
Avoid permanent bottom sheets for the micro interactions unless the screen is specifically designed around one.
Keep map gestures available whenever the micro interactions does not require modal focus.
Prevent accidental map gestures while interacting with critical micro interactions controls.
Use pointer-events layering intentionally for the micro interactions.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the micro interactions.
Use MapLibre layers for geographic information whenever possible for the micro interactions.
Use DOM overlays only for interaction-heavy micro interactions controls.
Keep route geometry visually dominant over secondary map labels in the micro interactions.
Dim irrelevant map detail behind active micro interactions guidance.
Use a clear active route line for the micro interactions.
Use a thinner inactive route line for alternate micro interactions paths.
Use checkpoint nodes to divide long micro interactions journeys into understandable segments.
Use start and destination markers consistently in the micro interactions.
Use directional orientation for moving rider markers in the micro interactions.
Avoid using generic pins for every micro interactions object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the micro interactions.
Use clustering when many micro interactions entities overlap.
Use expansion behavior when a micro interactions cluster is selected.
Use proximity to determine emphasis for nearby micro interactions entities.
Use distance labels only when distance is actionable for the micro interactions.
Use live state indicators for connected micro interactions entities.
Use stale-state indicators when micro interactions data has not updated recently.
Never imply live micro interactions data when the network is offline.
Clearly communicate offline state within the micro interactions.
Use cached data gracefully for the micro interactions.
Design the micro interactions to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the micro interactions.
Show network state without turning the micro interactions into a diagnostic screen.
Keep system diagnostics secondary to the micro interactions user goal.
Use haptic-ready interaction semantics for the micro interactions where supported.
Use sound-ready states for the micro interactions where auditory feedback is useful.
Do not make sound the only indication of a critical micro interactions state.
Use clear visual acknowledgment after the micro interactions receives an action.
Use optimistic feedback only when the micro interactions action can safely be reversed.
Use progress indicators for long-running micro interactions operations.
Use skeletons only when they help preserve the micro interactions layout.
Avoid generic spinner-only loading states for major micro interactions screens.
Provide purposeful empty states for the micro interactions.
Provide recovery actions for micro interactions errors.
Keep error messages concise and actionable in the micro interactions.
Use a technical but human tone for micro interactions system messages.
Never use jargon that the rider cannot understand in the micro interactions.
Keep safety-critical copy direct and unambiguous in the micro interactions.
Validate the micro interactions at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the micro interactions at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the micro interactions in both portrait and landscape layouts.
Validate the micro interactions with long rider names.
Validate the micro interactions with long route names.
Validate the micro interactions with zero riders.
Validate the micro interactions with one rider.
Validate the micro interactions with a full group.
Validate the micro interactions with slow network conditions.
Validate the micro interactions with no network.
Validate the micro interactions with poor GPS accuracy.
Validate the micro interactions with rapidly changing telemetry.
Validate the micro interactions with accessibility text scaling.
Validate the micro interactions with reduced motion.
Validate the micro interactions with keyboard navigation where applicable.
Validate the micro interactions with screen readers for non-driving planning contexts.
Validate the micro interactions with touch and pointer input.
Validate the micro interactions with glove-friendly target sizing.
Document every interactive state of the micro interactions.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the micro interactions.
Create a reusable component contract for the micro interactions.
Keep component APIs semantic rather than visual-only for the micro interactions.
Separate data state from presentation state in the micro interactions.
Keep animation state separate from business state in the micro interactions.
Avoid hardcoding user-specific values into the micro interactions.
Drive micro interactions values from the application's data layer.
Keep the micro interactions resilient to missing optional data.
Keep the micro interactions deterministic during replay or ride-history inspection.
Use consistent time formatting across the micro interactions.
Use consistent distance formatting across the micro interactions.
Use consistent rider status terminology across the micro interactions.
Use consistent alert severity terminology across the micro interactions.
Use consistent route terminology across the micro interactions.
Use consistent checkpoint terminology across the micro interactions.
Use consistent connection terminology across the micro interactions.
Do not introduce a new visual pattern for the micro interactions if an existing pattern already solves the same problem.
Prefer composition over component nesting in the micro interactions.
Keep the visual surface of the micro interactions calm even when the data is complex.
Use visual rhythm to distinguish primary and secondary micro interactions information.
Keep the center of the active cockpit visually open whenever possible.
Use asymmetry intentionally in the micro interactions.
Use the reference HMI's instrument-panel logic as inspiration for the micro interactions.
Adapt the HMI logic to motorcycles rather than reproducing car-specific semantics.
Make the micro interactions feel native to Rideclub's spatial operating-system concept.
The final micro interactions must not look like a generic admin dashboard.
The final micro interactions must not look like a generic fintech dashboard.
The final micro interactions must not look like a generic social feed.
The final micro interactions must not look like a generic navigation clone.
The final micro interactions must feel like one cohesive Rideclub cockpit.
# 72 — MOTION SYSTEM
Define the motion as a first-class spatial system, not a generic card component.
Keep the map or primary spatial context visible whenever the motion benefits from geographic awareness.
Use a restrained near-black foundation behind the motion.
Use #F4F7FA for primary readable values in the motion.
Use #AAB1BD for supporting labels in the motion.
Use #66707D for low-priority metadata in the motion.
Use #FF4D21 only for Rideclub-primary actions in the motion.
Use cyan for live communication state when applicable to the motion.
Use green for successful or healthy state when applicable to the motion.
Use amber for caution state when applicable to the motion.
Use red only for critical state when applicable to the motion.
Use technical typography for telemetry values associated with the motion.
Use human-readable typography for rider-facing copy associated with the motion.
Avoid unnecessary rounded rectangles in the motion.
Avoid placing every datum inside its own container in the motion.
Use one-pixel structural rules when the motion needs visual grouping.
Use negative space as the first grouping mechanism in the motion.
Use radial geometry when the motion represents a measurable quantity.
Use nodes when the motion represents people or geographic entities.
Use lines when the motion represents a relationship or sequence.
Use rings when the motion represents progress, cohesion, or capacity.
Use large numerals when the motion contains a primary metric.
Use compact labels when the motion contains secondary telemetry.
Use icons only when they improve recognition or reduce text.
Keep touch targets at least forty-eight pixels for interactive motion controls.
Provide a larger sixty-four-pixel interaction zone for the most important motion action during riding.
Do not require precise tapping for critical motion actions.
Use hold-to-confirm for irreversible or safety-sensitive motion actions where appropriate.
Provide immediate visual feedback for every interactive motion action.
Animate the motion only when the animation communicates state, direction, or progress.
Avoid decorative perpetual animation in the motion.
Use sixty-to-two-hundred-fifty millisecond transitions for normal motion UI changes.
Use slower transitions only for spatial state changes that need orientation.
Keep active ride interactions fast and predictable in the motion.
Use opacity changes to establish secondary hierarchy in the motion.
Use scale changes sparingly in the motion.
Avoid large bounce animations in the motion.
Use subtle glow to indicate active state in the motion.
Never use glow as the only indicator of an important motion state.
Pair important motion states with text, iconography, or geometry.
Preserve the visual hierarchy of the motion under reduced-motion settings.
Ensure the motion remains understandable without animation.
Ensure the motion remains usable at high text zoom.
Ensure the motion remains usable in strong outdoor light where possible.
Use high contrast between the motion primary value and its background.
Do not use tiny gray text for essential motion information.
Keep secondary motion information visually subordinate but readable.
Avoid excessive letter spacing in normal sentences within the motion.
Use uppercase tracking only for short telemetry labels in the motion.
Use tabular numerals for changing motion values.
Keep decimal precision consistent across the motion.
Use locale-aware formatting for distance and speed in the motion.
Use metric units by default for the motion when the user is in a metric locale.
Allow unit preferences to be changed in settings for the motion.
Use safe-area insets around the motion on mobile devices.
Keep important motion content away from gesture navigation edges.
Support landscape orientation for riding-focused motion screens.
Support portrait orientation for planning-focused motion screens.
Allow the motion to reorganize rather than simply shrink at smaller widths.
Do not stack every motion element vertically on mobile.
Use edge rails for compact motion telemetry on narrow screens.
Use bottom sheets only when the motion needs temporary detailed interaction.
Avoid permanent bottom sheets for the motion unless the screen is specifically designed around one.
Keep map gestures available whenever the motion does not require modal focus.
Prevent accidental map gestures while interacting with critical motion controls.
Use pointer-events layering intentionally for the motion.
Keep visual overlays above the map but logically separate from map rendering.
Use a consistent z-index hierarchy for the motion.
Use MapLibre layers for geographic information whenever possible for the motion.
Use DOM overlays only for interaction-heavy motion controls.
Keep route geometry visually dominant over secondary map labels in the motion.
Dim irrelevant map detail behind active motion guidance.
Use a clear active route line for the motion.
Use a thinner inactive route line for alternate motion paths.
Use checkpoint nodes to divide long motion journeys into understandable segments.
Use start and destination markers consistently in the motion.
Use directional orientation for moving rider markers in the motion.
Avoid using generic pins for every motion object.
Use distinct geometry for rider, checkpoint, destination, hazard, and POI in the motion.
Use clustering when many motion entities overlap.
Use expansion behavior when a motion cluster is selected.
Use proximity to determine emphasis for nearby motion entities.
Use distance labels only when distance is actionable for the motion.
Use live state indicators for connected motion entities.
Use stale-state indicators when motion data has not updated recently.
Never imply live motion data when the network is offline.
Clearly communicate offline state within the motion.
Use cached data gracefully for the motion.
Design the motion to degrade gracefully when GPS accuracy decreases.
Show GPS confidence without overwhelming the motion.
Show network state without turning the motion into a diagnostic screen.
Keep system diagnostics secondary to the motion user goal.
Use haptic-ready interaction semantics for the motion where supported.
Use sound-ready states for the motion where auditory feedback is useful.
Do not make sound the only indication of a critical motion state.
Use clear visual acknowledgment after the motion receives an action.
Use optimistic feedback only when the motion action can safely be reversed.
Use progress indicators for long-running motion operations.
Use skeletons only when they help preserve the motion layout.
Avoid generic spinner-only loading states for major motion screens.
Provide purposeful empty states for the motion.
Provide recovery actions for motion errors.
Keep error messages concise and actionable in the motion.
Use a technical but human tone for motion system messages.
Never use jargon that the rider cannot understand in the motion.
Keep safety-critical copy direct and unambiguous in the motion.
Validate the motion at 320, 375, 390, 430, 768, 1024, 1280, 1440, and 1920 CSS-pixel widths.
Validate the motion at 667, 740, 812, 844, 932, 1080, and 1200 CSS-pixel heights.
Validate the motion in both portrait and landscape layouts.
Validate the motion with long rider names.
Validate the motion with long route names.
Validate the motion with zero riders.
Validate the motion with one rider.
Validate the motion with a full group.
Validate the motion with slow network conditions.
Validate the motion with no network.
Validate the motion with poor GPS accuracy.
Validate the motion with rapidly changing telemetry.
Validate the motion with accessibility text scaling.
Validate the motion with reduced motion.
Validate the motion with keyboard navigation where applicable.
Validate the motion with screen readers for non-driving planning contexts.
Validate the motion with touch and pointer input.
Validate the motion with glove-friendly target sizing.
Document every interactive state of the motion.
Document default, hover, pressed, focused, selected, active, disabled, loading, error, offline, and success states for the motion.
Create a reusable component contract for the motion.
Keep component APIs semantic rather than visual-only for the motion.
Separate data state from presentation state in the motion.
Keep animation state separate from business state in the motion.
Avoid hardcoding user-specific values into the motion.
Drive motion values from the application's data layer.
Keep the motion resilient to missing optional data.
Keep the motion deterministic during replay or ride-history inspection.
Use consistent time formatting across the motion.
Use consistent distance formatting across the motion.
Use consistent rider status terminology across the motion.
Use consistent alert severity terminology across the motion.