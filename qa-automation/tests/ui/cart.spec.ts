import { expect, test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test('user can add one product to the cart', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.open();
  await loginPage.login('standard_user', 'secret_sauce');
  await page.getByRole('button', { name: 'Add to cart' }).first().click();

  await expect(page.getByTestId('shopping-cart-badge')).toHaveText('1');
});

test('user can remove the product from the cart', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.open();
  await loginPage.login('standard_user', 'secret_sauce');
  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  await page.getByRole('button', { name: 'Remove' }).first().click();

  await expect(page.getByTestId('shopping-cart-badge')).toBeHidden();
});

test('user can log out from the side menu', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.open();
  await loginPage.login('standard_user', 'secret_sauce');
  await page.getByRole('button', { name: 'Open Menu' }).click();
  await page.getByTestId('logout-sidebar-link').click();

  await expect(page.getByTestId('login-button')).toBeVisible();
});
