import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedListItemComponent } from './feed-list-item.component';

describe('ListItemComponent', () => {
  let component: FeedListItemComponent;
  let fixture: ComponentFixture<FeedListItemComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FeedListItemComponent]
    });
    fixture = TestBed.createComponent(FeedListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
