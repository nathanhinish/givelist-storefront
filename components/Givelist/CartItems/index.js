import Grid from "@material-ui/core/Grid";
import CartEmptyMessage from "@reactioncommerce/components/CartEmptyMessage/v1";
import CartItems from "components/CartItems";
import React from "react";

export default function GivelistCartItems(props) {
  const { cart, classes, hasMoreCartItems, loadMoreCartItems, onItemQuantityChange, onRemoveItem, onClickExit } = props;

  if (cart && Array.isArray(cart.items) && cart.items.length) {
    return (
      <Grid item xs={12} md={8}>
        <div className={classes.itemWrapper}>
          <CartItems
            hasMoreCartItems={hasMoreCartItems}
            onLoadMoreCartItems={loadMoreCartItems}
            items={cart.items}
            onChangeCartItemQuantity={onItemQuantityChange}
            onRemoveItemFromCart={onRemoveItem}
          />
        </div>
      </Grid>
    );
  }

  return (
    <Grid item xs={12} className={classes.cartEmptyMessageContainer}>
      <CartEmptyMessage onClick={onClickExit} />
    </Grid>
  );
}
