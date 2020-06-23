import React, { Component, useState } from "react";
import PropTypes from "prop-types";
import Button from "@reactioncommerce/components/Button/v1";
import { PayPalButton } from "react-paypal-button-v2";
import Router from "translations/i18nRouter";
import { placeOrderMutation } from "../../hooks/orders/placeOrder.gql";

export default function CheckoutButtons(props) {
  const {
    isDisabled,
    primaryClassName,
    primaryButtonText,
    primaryButtonRoute,
    amount,
    currency,
    clientId,
    onPlaceOrder,
  } = props;

  const lsOrderData = null; //localStorage.getItem('tempOrder');

  let orderData = null;
  if (lsOrderData) {
    orderData = JSON.parse(lsOrderData);
  }

  function handleOnClick() {
    Router.push(primaryButtonRoute);
  }

  function handleSuccess(details, data) {
    localStorage.setItem("tempOrder", JSON.stringify({ details, data }));
    onPlaceOrder({ details, data });
  }

  function handleError(err) {
    console.info("handle error", err);
  }

  function handleCancel(data) {
    console.info("handle cancel", data);
  }

  return (
    <div className="checkout-buttons">
      {!orderData ? (
        <PayPalButton
          amount={amount}
          currency={currency}
          shippingPreference="NO_SHIPPING"
          clientId={clientId}
          onSuccess={handleSuccess}
          catchError={handleError}
          onCancel={handleCancel}
        />
      ) : (
        <Button onClick={() => onPlaceOrder(orderData)}>Resend</Button>
      )}
    </div>
  );
}

CheckoutButtons.propTypes = {
  /**
   * Set to `true` to prevent the button from calling `onClick` when clicked
   */
  isDisabled: PropTypes.bool,
  /**
   * The NextJS route name for the primary checkout button.
   */
  primaryButtonRoute: PropTypes.string,
  /**
   * Text to display inside the button
   */
  primaryButtonText: PropTypes.string,
  /**
   * className for primary checkout button
   */
  primaryClassName: PropTypes.string,

  amount: PropTypes.number,
  currency: PropTypes.string,
  clientId: PropTypes.string,
};

CheckoutButtons.defaultProps = {
  primaryButtonRoute: "/cart/checkout",
  primaryButtonText: "Checkout",
};
