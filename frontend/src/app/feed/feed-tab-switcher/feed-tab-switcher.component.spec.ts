import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedTabSwitcherComponent } from './feed-tab-switcher.component';

describe('FeedTabSwitcherComponent', () => {
  let component: FeedTabSwitcherComponent;
  let fixture: ComponentFixture<FeedTabSwitcherComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FeedTabSwitcherComponent]
    });
    fixture = TestBed.createComponent(FeedTabSwitcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
