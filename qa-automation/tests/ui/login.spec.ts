import { expect, test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test('valid user sees the Products title', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.open();
  await loginPage.login('standard_user', 'secret_sauce');

  await expect(page.getByText('Products', { exact: true })).toBeVisible();
});

test('locked out user sees an error', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.open();
  await loginPage.login('locked_out_user', 'secret_sauce');

  await loginPage.expectLoginError('locked out');
});
