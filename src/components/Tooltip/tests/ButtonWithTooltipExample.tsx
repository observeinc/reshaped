import React from "react";
import Tooltip from "components/Tooltip";
import Button from "components/Button";
import Actionable from "components/Actionable";
import type { TooltipProps } from "components/Tooltip";

// This simulates the TriggerAttributes type that should be exported
// In a real fix, this would be imported from the Flyout component
type TriggerAttributes = {
	ref: React.RefObject<HTMLButtonElement | null>;
	onBlur?: (e: React.FocusEvent) => void;
	onFocus?: () => void;
	onMouseDown?: () => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	onTouchStart?: () => void;
	onClick?: () => void;
	"aria-describedby"?: string;
	"aria-haspopup"?: "dialog" | "menu" | "listbox";
	"aria-autocomplete"?: "list";
	"aria-expanded"?: boolean;
	"aria-controls"?: string;
};

export interface ButtonWithTooltipProps {
	/**
	 * Button text content
	 */
	children: React.ReactNode;
	/**
	 * Tooltip content - can be string or full tooltip config
	 */
	tooltip?: string | Omit<TooltipProps, "children">;
	/**
	 * Whether the button is disabled
	 */
	disabled?: boolean;
	/**
	 * Additional attributes to pass to the button
	 */
	attributes?: Record<string, any>;
	/**
	 * Click handler
	 */
	onClick?: () => void;
}

// Internal component that renders the actual button
const ButtonWithAttributes = ({
	children,
	disabled,
	attributes,
	tooltipAttributes,
	onClick,
}: ButtonWithTooltipProps & {
	tooltipAttributes?: TriggerAttributes;
}) => {
	return (
		<Button
			disabled={disabled}
			onClick={onClick}
			attributes={{
				...attributes,
				...tooltipAttributes,
			}}
		>
			{children}
		</Button>
	);
};

/**
 * Example component that demonstrates the tooltip attributes casting issue
 * and shows how it can be resolved.
 *
 * This mirrors the pattern from your app code where you needed to cast
 * tooltip attributes.
 */
export const ButtonWithTooltipExample: React.FC<ButtonWithTooltipProps> = ({
	tooltip,
	...props
}) => {
	if (!tooltip) {
		return <ButtonWithAttributes {...props} />;
	}

	const tooltipConfig: Omit<TooltipProps, "children"> =
		typeof tooltip === "string" ? { text: tooltip } : tooltip;

	return (
		<Tooltip {...tooltipConfig}>
			{(tooltipAttributes) => {
				// For disabled buttons, we need to wrap in Actionable to enable tooltip hover
				// since disabled buttons don't receive mouse events
				if (props.disabled) {
					return (
						<Actionable attributes={tooltipAttributes} as="div">
							<ButtonWithAttributes {...props} />
						</Actionable>
					);
				}

				// For enabled buttons, pass tooltip attributes directly to the button
				// THIS IS WHERE THE CASTING ISSUE OCCURS:
				// tooltipAttributes has type: Parameters<FlyoutTriggerProps["children"]>[0] | {}
				// but ButtonWithAttributes expects TriggerAttributes

				// CURRENT WORKAROUND (what you had to do):
				return (
					<ButtonWithAttributes
						{...props}
						tooltipAttributes={tooltipAttributes as TriggerAttributes}
					/>
				);

				// IDEAL SOLUTION (if TriggerAttributes was exported):
				// No casting would be needed because the types would align properly
			}}
		</Tooltip>
	);
};

/**
 * Alternative implementation using type guards to avoid casting
 */
export const ButtonWithTooltipSafer: React.FC<ButtonWithTooltipProps> = ({ tooltip, ...props }) => {
	if (!tooltip) {
		return <ButtonWithAttributes {...props} />;
	}

	const tooltipConfig: Omit<TooltipProps, "children"> =
		typeof tooltip === "string" ? { text: tooltip } : tooltip;

	// Type guard to check if attributes are valid trigger attributes
	const isTriggerAttributes = (attrs: any): attrs is TriggerAttributes => {
		return attrs && typeof attrs === "object" && Object.keys(attrs).length > 0;
	};

	return (
		<Tooltip {...tooltipConfig}>
			{(tooltipAttributes) => {
				if (props.disabled) {
					return (
						<Actionable attributes={tooltipAttributes} as="div">
							<ButtonWithAttributes {...props} />
						</Actionable>
					);
				}

				// Use type guard instead of casting
				const safeAttributes = isTriggerAttributes(tooltipAttributes)
					? tooltipAttributes
					: undefined;

				return <ButtonWithAttributes {...props} tooltipAttributes={safeAttributes} />;
			}}
		</Tooltip>
	);
};

/**
 * Demonstration of the root cause - Tooltip's children prop type
 */
export const TooltipTypeDemo: React.FC = () => {
	return (
		<div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
			<h3>Tooltip Type Issue Demonstration</h3>

			<div>
				<h4>With tooltip text (attributes are TriggerAttributes):</h4>
				<Tooltip text="I have text">
					{(attributes) => {
						// Here, attributes has the full TriggerAttributes type
						// but TypeScript sees it as: Parameters<FlyoutTriggerProps["children"]>[0] | {}
						console.log("With text - attributes keys:", Object.keys(attributes));
						return <Button attributes={attributes}>Button with tooltip</Button>;
					}}
				</Tooltip>
			</div>

			<div>
				<h4>Without tooltip text (attributes are empty object):</h4>
				<Tooltip>
					{(attributes) => {
						// Here, attributes is {} (empty object)
						console.log("Without text - attributes keys:", Object.keys(attributes));
						return <Button attributes={attributes}>Button without tooltip</Button>;
					}}
				</Tooltip>
			</div>
		</div>
	);
};
