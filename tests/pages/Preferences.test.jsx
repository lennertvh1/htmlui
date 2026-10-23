import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Preferences } from "../../src/pages/Preferences";
import React from "react";
import { setupAPIMock } from "../testutils/api-mocks";

let axiosMock;

/**
 * Setup API mocks before each test
 */
beforeEach(() => {
  axiosMock = setupAPIMock();
  // Add mock for notification profiles endpoint that NotificationEditor uses
  axiosMock.onGet("/api/v1/notificationProfiles").reply(200, []);

  render(<Preferences />);
});

/**
 * Clean up after each test
 */
afterEach(() => {
  axiosMock.reset();
});

/**
 *
 */
describe("Select the light theme", () => {
  test("Should select light theme", () => {
    userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Choose a theme" }),
      screen.getByRole("option", { name: "Light (morning mist)" }),
    );

    expect(screen.getByRole("option", { name: "Light (morning mist)" }).selected).toBe(true);
  });
});

/**
 *
 */
describe("Test number of themes", () => {
  test("Should have two themes", () => {
    let theme = screen.getByRole("combobox", { name: "Choose a theme" });
    expect(theme).toHaveLength(2);
  });
});

/**
 *
 */
describe("Test byte representation", () => {
  test("Should have two options", () => {
    let theme = screen.getByRole("combobox", {
      name: "Choose how sizes are shown",
    });
    expect(theme).toHaveLength(2);
  });
});
