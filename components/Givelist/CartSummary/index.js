import { useApolloClient } from "@apollo/client";
import Grid from "@material-ui/core/Grid";
import CartSummary from "@reactioncommerce/components/CartSummary/v1";
import CheckoutButtons from "../../CheckoutButtons";
import PropTypes from "prop-types";
import React from "react";

export default function GivelistCartSummary(props) {
  const { cart, shop, classes, clientId, onSuccess, onCreateOrder, onCancel } = props;

  async function handleSuccess(result) {
    if (onSuccess) {
      onSuccess(result);
    }
  }

  if (cart && cart.checkout && cart.checkout.summary && Array.isArray(cart.items) && cart.items.length) {
    const { fulfillmentTotal, itemTotal, surchargeTotal, taxTotal, total } = cart.checkout.summary;

    return (
      <Grid item xs={12} md={3}>
        <CartSummary
          displayShipping={fulfillmentTotal && fulfillmentTotal.displayAmount}
          displaySubtotal={itemTotal && itemTotal.displayAmount}
          displaySurcharge={surchargeTotal && surchargeTotal.displayAmount}
          displayTax={taxTotal && taxTotal.displayAmount}
          displayTotal={total && total.displayAmount}
          itemsQuantity={cart.totalItemQuantity}
        />
        <div className={classes.checkoutButtonsContainer}>
          <CheckoutButtons
            amount={total.amount}
            currency={total.currency.code}
            clientId={clientId}
            onCreateOrder={onCreateOrder}
            onSuccess={handleSuccess}
            onCancel={onCancel}
          />
        </div>
      </Grid>
    );
  }

  return null;
}

GivelistCartSummary.propTypes = {
  cart: PropTypes.object,
  shop: PropTypes.object,
  classes: PropTypes.object,
  clientId: PropTypes.string,
  onCreateOrder: PropTypes.func,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
};
